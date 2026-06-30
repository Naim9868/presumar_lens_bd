// Tiny one-shot HTTP sink that receives the PDF blob POSTed by the harness
// running in headless Edge and writes it to disk. Listens on 127.0.0.1:3737
// and exits cleanly after one successful upload.

import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.PDF_OUT ?? resolve(__dirname, 'sales-report.pdf');

const server = createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/upload') {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    writeFileSync(OUT, buf);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, bytes: buf.length, file: OUT }));
    console.log(`[sink] wrote ${buf.length} bytes -> ${OUT}`);
    setTimeout(() => server.close(), 100);
  });
  req.on('error', (e) => {
    res.statusCode = 500;
    res.end(String(e));
    server.close();
  });
});

server.listen(3737, '127.0.0.1', () => {
  console.log(`[sink] listening on http://127.0.0.1:3737 -> ${OUT}`);
});