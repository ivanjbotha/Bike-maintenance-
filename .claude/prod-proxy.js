// Local proxy to the production deployment so the preview browser can load
// it same-origin and we can read its console output for debugging.
const http = require('http');
const https = require('https');

const TARGET = 'bikeservice-pi.vercel.app';
const port = process.env.PORT || 4173;

http
  .createServer((req, res) => {
    const options = {
      hostname: TARGET,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: TARGET },
    };
    const upstream = https.request(options, (up) => {
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    });
    upstream.on('error', (e) => {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('proxy error: ' + e.message);
    });
    req.pipe(upstream);
  })
  .listen(port, () => console.log('prod proxy listening on ' + port));
