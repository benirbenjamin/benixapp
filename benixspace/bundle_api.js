import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

try {
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

  console.log('✓ Successfully bundled api/index.js for Vercel Serverless (ESM with createRequire banner)');
} catch (err) {
  console.error('Failed to bundle serverless API:', err);
  process.exit(1);
}
