const { execSync } = require('child_process');

try {
  // Try the normal npx first
  execSync('npx tailwindcss init -p', { stdio: 'inherit' });
} catch {
  // Fallback: run Tailwind CLI via the local package
  execSync('node ./node_modules/tailwindcss/lib/cli.js init -p', { stdio: 'inherit' });
}
