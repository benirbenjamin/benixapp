import http from 'http';
import handler from './api/index.js';

const server = http.createServer((req, res) => {
  handler(req, res);
});

server.listen(4005, async () => {
  console.log('Test server listening on port 4005');

  async function makeReq(path, method = 'GET', body = null) {
    return new Promise((resolve) => {
      const data = body ? JSON.stringify(body) : null;
      const r = http.request(
        {
          hostname: '127.0.0.1',
          port: 4005,
          path,
          method,
          headers: {
            'content-type': 'application/json',
            ...(data ? { 'content-length': Buffer.byteLength(data) } : {})
          }
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => {
            resolve({ status: res.statusCode, body: b });
          });
        }
      );
      r.on('error', (e) => resolve({ error: e.message }));
      if (data) r.write(data);
      r.end();
    });
  }

  console.log('Testing /api/health...');
  const h = await makeReq('/api/health');
  console.log('HEALTH:', h.status, h.body);

  console.log('\nTesting /api/auth/me...');
  const me = await makeReq('/api/auth/me');
  console.log('ME:', me.status, me.body);

  console.log('\nTesting /api/tv/stations...');
  const st = await makeReq('/api/tv/stations');
  console.log('STATIONS:', st.status, st.body.substring(0, 100));

  console.log('\nTesting POST /api/auth/login...');
  const lg = await makeReq('/api/auth/login', 'POST', { email: 'benirabole1@gmail.com', password: 'test' });
  console.log('LOGIN:', lg.status, lg.body);

  server.close(() => {
    console.log('Test server closed.');
    process.exit(0);
  });
});
