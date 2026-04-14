const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const TARGET_DIR = './'; // Runs in the current directory
const IGNORE_DIRS = ['node_modules', '.git', '.next', '.vercel'];
const IGNORE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf', '.ico', '.zip'];

// The order matters here. We replace more specific strings first.
const REPLACEMENTS = [
  { regex: /Pellucen AI/g, replacement: 'Pely.ai' },
  { regex: /Pellucen/g, replacement: 'Pely.ai' },
  { regex: /pellucen\.co\.uk/g, replacement: 'pely.ai' },
  { regex: /info@pellucen\.co\.uk/g, replacement: 'info@pely.ai' },
  { regex: /pellucenAI/g, replacement: 'pely.ai' },
  // Catch-all for class names, file paths, or lowercase references
  { regex: /pellucen/g, replacement: 'pely' }, 
];

// --- EXECUTION ---
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(fullPath);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (!IGNORE_EXTS.includes(ext) && file !== 'migrate.js') {
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const { regex, replacement } of REPLACEMENTS) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

console.log('Starting Pely.ai codebase migration...');
walkDir(TARGET_DIR);
console.log('Migration complete!');