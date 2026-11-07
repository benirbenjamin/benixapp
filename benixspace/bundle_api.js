import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

try {
  // 1. Bundle for Vercel Serverless
  esbuild.buildSync({
    entryPoints: ['src/server/serverless.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    outfile: 'api/index.js',
    external: ['pg-native']
  });

  // Mirror to root api/index.js in case Vercel project root is configured as repository root
  try {
    const rootApiDir = path.resolve('..', 'api');
    if (!fs.existsSync(rootApiDir)) {
      fs.mkdirSync(rootApiDir, { recursive: true });
    }
    fs.copyFileSync('api/index.js', path.join(rootApiDir, 'index.js'));
  } catch (copyErr) {
    console.warn('Could not mirror to root api directory:', copyErr.message);
  }

  console.log('✓ Successfully bundled api/index.js for Vercel Serverless');

  // 2. Bundle Standalone server for cPanel / Phusion Passenger / VPS
  const esmBanner = `import { createRequire } from 'module';
import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __pathDirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __pathDirname(__filename);`;

  esbuild.buildSync({
    entryPoints: ['src/server/standalone.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    banner: {
      js: esmBanner
    },
    outfile: 'server.js',
    external: ['pg-native']
  });

  // Mirror to dist/server/index.js in case cPanel specifies dist/server/index.js
  try {
    const distServerDir = path.resolve('dist', 'server');
    if (!fs.existsSync(distServerDir)) {
      fs.mkdirSync(distServerDir, { recursive: true });
    }
    fs.copyFileSync('server.js', path.join(distServerDir, 'index.js'));
  } catch (copyErr) {
    console.warn('Could not mirror to dist/server directory:', copyErr.message);
  }

  console.log('✓ Successfully bundled server.js and dist/server/index.js for cPanel & standalone Node.js');
} catch (err) {
  console.error('Failed to bundle server files:', err);
  process.exit(1);
}
