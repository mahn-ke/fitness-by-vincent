import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
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

// Equipment weights of the app's gym mode, one JSON document per user. wger
// has nowhere to keep them, so they live on the app-data volume.
const EQUIPMENT_DIR = path.join(process.env.DATA_DIR || '/data', 'equipment');
const WGER_URL = process.env.WGER_URL || 'http://web:8000';

// The wger user behind the request's bearer token. wger decides whether the
// token is valid, so after it accepted it the payload can be read as is.
// Otherwise wger's refusal is relayed, the app then refreshes its token.
async function authenticate(req) {
  const authorization = req.get('authorization') || '';
  const token = authorization.match(/^Bearer (\S+)$/)?.[1];
  if (!token) {
    return { status: 401, body: { detail: 'Missing bearer token' } };
  }
  const resp = await fetch(`${WGER_URL}/api/v2/userprofile/`, {
    headers: { Authorization: authorization, Accept: 'application/json', 'X-Forwarded-Proto': 'https' },
    redirect: 'manual',
  });
  if (!resp.ok) {
    const text = await resp.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: `Upstream status ${resp.status}` };
    }
    return { status: resp.status >= 500 ? 502 : resp.status, body };
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return { status: 401, body: { detail: 'Unreadable token' } };
  }
  // allauth puts the user ID into sub, SimpleJWT into user_id
  const userId = String(payload.sub ?? payload.user_id ?? '');
  if (!/^\d+$/.test(userId)) {
    return { status: 401, body: { detail: 'Token without a user' } };
  }
  return { userId };
}

const equipmentFile = (userId) => path.join(EQUIPMENT_DIR, `${userId}.json`);

app.get('/equipment', async (req, res) => {
  const auth = await authenticate(req);
  if (!auth.userId) {
    return res.status(auth.status).json(auth.body);
  }
  try {
    return res.json(JSON.parse(await readFile(equipmentFile(auth.userId), 'utf8')));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.json({ updatedAt: null, data: null });
    }
    throw err;
  }
});

app.put('/equipment', express.json({ limit: '256kb' }), async (req, res) => {
  const auth = await authenticate(req);
  if (!auth.userId) {
    return res.status(auth.status).json(auth.body);
  }
  const data = req.body?.data;
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ detail: 'Expected {"data": {...}}' });
  }
  const stored = { updatedAt: new Date().toISOString(), data };
  await mkdir(EQUIPMENT_DIR, { recursive: true });
  // Written next to it and renamed, so a crash never leaves half a file
  const file = equipmentFile(auth.userId);
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(stored));
  await rename(tmp, file);
  return res.json(stored);
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`App listening on :${PORT}`);
});
