import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3001;
const UI_DIR = path.resolve(process.cwd(), 'ui');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;"
  );

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(UI_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`🌐 BNB-QUSD Web4 Terminal / Telegram Mini App running at: http://localhost:${PORT}`);
});
