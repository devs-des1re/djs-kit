import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const sourceRoot = path.resolve('src/templates/ts/src');
const targetRoot = path.resolve('src/templates/js/src');
const workspaceRoot = path.resolve('.');

function assertInsideWorkspace(target) {
  const relative = path.relative(workspaceRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to sync outside the workspace: ${target}`);
  }
}

function syncDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      syncDir(srcPath, destPath);
      continue;
    }

    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) continue;

    const outputPath = destPath.replace(/\.ts$/, '.js');
    const source = fs.readFileSync(srcPath, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        esModuleInterop: true,
        sourceMap: false,
      },
      fileName: srcPath,
    }).outputText;

    fs.writeFileSync(outputPath, output);
  }
}

assertInsideWorkspace(sourceRoot);
assertInsideWorkspace(targetRoot);
fs.rmSync(targetRoot, { recursive: true, force: true });
syncDir(sourceRoot, targetRoot);
console.log('JS template updated successfully.');
