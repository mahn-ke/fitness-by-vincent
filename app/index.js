import express from 'express';
import morgan from 'morgan';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('combined'));

function pad(n) { return String(n).padStart(2, '0'); }

function formatDateYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}${m}${d}`;
}

function transformIcal(icalText) {
  // Transform DTSTART;VALUE=DATE:YYYYMMDD -> DTSTART:YYYYMMDDT235900 (prev day)
  // Transform DTEND;VALUE=DATE:YYYYMMDD -> DTEND:YYYYMMDDT030000
  const lines = icalText.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(/^DTSTART;VALUE=DATE:(\d{8})$/))) {
      const y = Number(m[1].slice(0, 4));
      const mo = Number(m[1].slice(4, 6)) - 1;
      const d = Number(m[1].slice(6, 8));
      const orig = new Date(Date.UTC(y, mo, d));
      const prev = new Date(orig.getTime() - 24 * 60 * 60 * 1000);
      const prevStr = formatDateYYYYMMDD(prev);
      out.push(`DTSTART:${prevStr}T235900`);
      continue;
    }
    if ((m = line.match(/^DTEND;VALUE=DATE:(\d{8})$/))) {
      const y = Number(m[1].slice(0, 4));
      const mo = Number(m[1].slice(4, 6)) - 1;
      const d = Number(m[1].slice(6, 8));
      const orig = new Date(Date.UTC(y, mo, d));
      const origStr = formatDateYYYYMMDD(orig);
      out.push(`DTEND:${origStr}T030000`);
      continue;
    }
    out.push(line);
  }
  return out.join('\r\n');
}

app.get('/:id/ical', async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.query;
  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }
  try {
    // Fetch from internal web service directly
    const url = `http://web:8000/en-gb/routine/${encodeURIComponent(id)}/ical?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      return res.status(resp.status).send(`Upstream error: ${resp.statusText}`);
    }
    const text = await resp.text();
    const transformed = transformIcal(text);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    return res.send(transformed);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal error');
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`App listening on :${PORT}`);
});
