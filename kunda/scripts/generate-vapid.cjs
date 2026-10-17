const crypto = require('crypto');

// Generate ECDH on curve prime256v1 (P-256) as required by RFC 8292 (VAPID)
const ecdh = crypto.createECDH('prime256v1');
ecdh.generateKeys();

const publicKey = ecdh.getPublicKey('base64url');
const privateKey = ecdh.getPrivateKey('base64url');

const fs = require('fs');

const result = {
  publicKey,
  privateKey,
  subject: 'mailto:admin@kunda.space',
  envFormat: `VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\nVAPID_SUBJECT=mailto:admin@kunda.space`
};

fs.writeFileSync('vapid-keys.json', JSON.stringify(result, null, 2), 'utf-8');
console.log('VAPID keys written to vapid-keys.json');

