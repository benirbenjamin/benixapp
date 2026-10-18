const { execSync } = require('child_process');

try {
  console.log('--- GIT STATUS ---');
  const status = execSync('git status -s', { encoding: 'utf-8' });
  console.log(status);

  console.log('--- GIT ADD ---');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('--- GIT COMMIT ---');
  const commitMsg = 'feat: add real YouTube videos, clean Google ads, avatar menu, dual signin buttons, and unified admin platform management';
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

  console.log('--- GIT PUSH ---');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✓ Successfully committed and pushed to origin main');
} catch (err) {
  console.error('Git error:', err.message);
}
