// Builds dist/esm (ES modules) and dist/cjs (CommonJS), both with .d.ts.
import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.cjs.json'], { stdio: 'inherit' });
// Tell Node that the files under dist/cjs are CommonJS although the package is "type": "module".
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }) + '\n');
writeFileSync('dist/esm/package.json', JSON.stringify({ type: 'module' }) + '\n');
console.log('built dist/esm and dist/cjs');
