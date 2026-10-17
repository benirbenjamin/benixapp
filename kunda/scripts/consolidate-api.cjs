const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const apiDir = path.join(projectRoot, 'api');
const routesDir = path.join(apiDir, '_routes');

if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
}

const foldersToMove = [
  'auth',
  'members',
  'messages',
  'wallet',
  'payments',
  'subscriptions',
  'admin',
  'upload',
  'tutorials',
  'notifications',
];

foldersToMove.forEach((folder) => {
  const src = path.join(apiDir, folder);
  const dest = path.join(routesDir, folder);
  if (fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
    console.log(`Moved ${folder} to _routes/${folder}`);
  }
});

// Update relative imports in all files in api/_routes
function updateImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updateImports(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("'../_lib/")) {
        content = content.replace(/'\.\.\/_lib\//g, "'../../_lib/");
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${path.relative(projectRoot, fullPath)}`);
      }
      if (content.includes('"../_lib/')) {
        content = content.replace(/"\.\.\/_lib\//g, '"../../_lib/');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${path.relative(projectRoot, fullPath)}`);
      }
    }
  }
}

updateImports(routesDir);
console.log('✅ All API sub-handlers consolidated into api/_routes');
