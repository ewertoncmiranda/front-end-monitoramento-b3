// Roda cada tests/ficha360/*.test.mjs num processo proprio: os testes simulam
// globais do navegador (window, document, HTMLElement) e nao podem se misturar.
// Arquivo novo de teste entra sozinho, sem editar package.json.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const pasta = fileURLToPath(new URL('.', import.meta.url));
const arquivos = readdirSync(pasta).filter((f) => f.endsWith('.test.mjs')).sort();
const falhas = [];

for (const arquivo of arquivos) {
  console.log(`\nficha360/${arquivo}`);
  const { status } = spawnSync(process.execPath, [join(pasta, arquivo)], { stdio: 'inherit' });
  if (status !== 0) falhas.push(arquivo);
}

console.log(`\nficha360: ${arquivos.length - falhas.length}/${arquivos.length} arquivos passaram`);
if (falhas.length) {
  console.error(`falharam: ${falhas.join(', ')}`);
  process.exit(1);
}
