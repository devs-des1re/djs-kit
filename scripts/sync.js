import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (srcPath.endsWith('.js')) {
      const content = fs.readFileSync(srcPath, 'utf8');
      const clean = content.replace(/\/\/# sourceMappingURL=.*\n?/g, '');
      fs.writeFileSync(destPath, clean);
    }
  }
}

copyDir('src/templates/ts/dist', 'src/templates/js/src');
console.log('JS template updated successfully.');
