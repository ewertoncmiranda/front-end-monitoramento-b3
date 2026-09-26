import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(raiz, 'public');

function arquivosEm(diretorio) {
  return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(diretorio, item.name);
    if (item.isDirectory()) return arquivosEm(caminho);
    return /\.(?:html|js)$/.test(item.name) ? [caminho] : [];
  });
}

const index = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
assert.match(index, /<html lang="pt-BR">/, 'A página deve declarar português do Brasil.');
assert.match(index, /<meta charset="UTF-8"/i, 'A página deve declarar UTF-8.');

const fontes = arquivosEm(publicDir).map((arquivo) => ({
  arquivo: path.relative(raiz, arquivo),
  conteudo: fs.readFileSync(arquivo, 'utf8'),
}));

for (const { arquivo, conteudo } of fontes) {
  assert.doesNotMatch(conteudo, /Ã.|Â.|�/, `${arquivo} contém indício de texto corrompido.`);
}

const interfaceCompleta = fontes.map(({ conteudo }) => conteudo).join('\n');
for (const rotuloAntigo of [
  '>Gestao<',
  '>Candles<',
  '>Formulas<',
  '>Padroes<',
  '>Glossario<',
  'Confianca:</strong>',
  'Sem analise ainda',
]) {
  assert.ok(!interfaceCompleta.includes(rotuloAntigo), `Rótulo sem revisão: ${rotuloAntigo}`);
}

assert.match(interfaceCompleta, /[çÇ]/, 'A interface deve preservar cedilha em UTF-8.');
assert.match(interfaceCompleta, /[ãõÃÕ]/, 'A interface deve preservar vogais com til em UTF-8.');

console.log('  ok  idioma pt-BR, UTF-8, cedilha, til e rótulos principais revisados');
