import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.join(process.cwd(), 'src/index.html'), 'utf8');
http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(5173, () => console.log('Web listening on http://localhost:5173'));
