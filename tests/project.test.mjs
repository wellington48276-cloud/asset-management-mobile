import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  }));
  return nested.flat();
}

test('não usa termos antigos na interface', async () => {
  const files = (await filesUnder('src')).filter((file) => /\.(js|jsx|css)$/.test(file));
  const content = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n').toLowerCase();
  assert.equal(content.includes('vistoriador'), false);
  assert.equal(content.includes('coleta'), false);
});

test('Apps Script exige token e confirma arquivo do Drive', async () => {
  const code = await readFile('Code.gs', 'utf8');
  assert.match(code, /validarToken_/);
  assert.match(code, /Drive\.Files\.get/);
  assert.match(code, /migrarSenhasParaHash/);
});
