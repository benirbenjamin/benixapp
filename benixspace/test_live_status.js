import https from 'https';

function check() {
  https.get('https://www.benix.space/api/health', (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('BODY:', data.substring(0, 300));
    });
  }).on('error', (e) => console.error('ERR:', e.message));
}

check();
