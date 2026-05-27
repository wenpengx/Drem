import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  'src',
  '.claude/agents',
  '.github',
  'README.md',
  'CLAUDE.md',
  'index.html',
  'package.json',
];

const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.venv']);
const textExtensions = new Set(['.js', '.jsx', '.mjs', '.css', '.html', '.json', '.md', '.yml', '.yaml']);

const markerCodes = [
  0xfffd,
  0x951f,
  0x934f,
  0x6d93,
  0x9473,
  0x93c4,
  0x9428,
  0x7db0,
  0x95bf,
  0x8119,
  0x8292,
];
const markers = markerCodes.map((code) => String.fromCharCode(code));

function shouldRead(filePath) {
  return textExtensions.has(path.extname(filePath));
}

function collect(entry, files = []) {
  const fullPath = path.resolve(root, entry);
  if (!fs.existsSync(fullPath)) return files;

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    if (ignoredDirs.has(path.basename(fullPath))) return files;
    for (const child of fs.readdirSync(fullPath)) {
      collect(path.join(entry, child), files);
    }
    return files;
  }

  if (stat.isFile() && shouldRead(fullPath)) {
    files.push(fullPath);
  }
  return files;
}

const files = targets.flatMap((target) => collect(target));
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (markers.some((marker) => line.includes(marker))) {
      findings.push(`${path.relative(root, file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (findings.length > 0) {
  console.error('Potential mojibake markers found:');
  for (const finding of findings) console.error(finding);
  process.exit(1);
}

console.log(`Encoding check passed (${files.length} files scanned).`);
