const http = require('http');

const body = JSON.stringify({
  verificationId: "63945c00-3872-48a8-bcd7-69d97208516a",
  action: "approve"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/verifications',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', console.error);
req.write(body);
req.end();
