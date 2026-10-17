const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'app');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

const rootLogo = path.join(__dirname, '..', 'logo.png');
const targetPublicLogo = path.join(publicDir, 'logo.png');
if (fs.existsSync(rootLogo)) {
  fs.copyFileSync(rootLogo, targetPublicLogo);
  console.log('Copied logo.png to public/logo.png');
}

const rootFavicon = path.join(__dirname, '..', 'favicon.ico');
const targetPublicFavicon = path.join(publicDir, 'favicon.ico');
const targetAppFavicon = path.join(appDir, 'favicon.ico');

if (fs.existsSync(rootFavicon)) {
  fs.copyFileSync(rootFavicon, targetPublicFavicon);
  fs.copyFileSync(rootFavicon, targetAppFavicon);
  console.log('Copied favicon.ico to public and app directories');
}
