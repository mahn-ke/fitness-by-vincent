# Simple Node.js app to proxy and transform iCal
FROM node:25-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY index.js ./
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]