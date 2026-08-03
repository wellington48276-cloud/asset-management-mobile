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

const files = (await filesUnder('src')).filter((file) => /\.(js|jsx|css)$/.test(file));
const problems = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (/\t/.test(content)) problems.push(`${file}: contém tabulação; use espaços.`);
  if (/\b(vistoriador|coleta)\b/i.test(content)) problems.push(`${file}: contém terminologia antiga.`);
  if (/console\.log\(/.test(content)) problems.push(`${file}: console.log não deve ficar no frontend.`);
  if (content.includes('\r\n')) problems.push(`${file}: use finais de linha LF.`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`Verificação concluída em ${files.length} arquivos.`);
