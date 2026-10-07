import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const raizPublica = new URL('../public/', import.meta.url);
const html = readFileSync(new URL('index.html', raizPublica), 'utf8');

let casos = 0;
function caso(nome, fn) {
  fn();
  casos++;
  console.log(`  ok  ${nome}`);
}

const assets = [
  {
    caminho: 'vendor/bootstrap-5.3.3/bootstrap.min.css',
    assinatura: /Bootstrap\s+v5\.3\.3/,
    tamanhoMinimo: 200_000,
  },
  {
    caminho: 'vendor/bootstrap-5.3.3/bootstrap.bundle.min.js',
    assinatura: /Bootstrap\s+v5\.3\.3/,
    tamanhoMinimo: 70_000,
  },
  {
    caminho: 'vendor/lightweight-charts-4.2.0/lightweight-charts.standalone.production.js',
    assinatura: /Lightweight Charts.*4\.2\.0/,
    tamanhoMinimo: 150_000,
  },
];

caso('index usa somente assets locais para Bootstrap e lightweight-charts', () => {
  assert.doesNotMatch(html, /(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/i);
  for (const { caminho } of assets) {
    assert.match(html, new RegExp(`(?:href|src)="${caminho.replaceAll('.', '\\.') }"`));
  }
});

caso('assets locais existem, tem a versao esperada e nao sao arquivos vazios', () => {
  for (const { caminho, assinatura, tamanhoMinimo } of assets) {
    const url = new URL(caminho, raizPublica);
    assert.ok(statSync(url).size >= tamanhoMinimo, `${caminho} menor que o esperado`);
    assert.match(readFileSync(url, 'utf8').slice(0, 1000), assinatura, `${caminho} sem assinatura da versao`);
  }
});

caso('licencas das dependencias vendorizadas acompanham os assets', () => {
  assert.ok(statSync(new URL('vendor/bootstrap-5.3.3/LICENSE', raizPublica)).size > 500);
  assert.ok(statSync(new URL('vendor/lightweight-charts-4.2.0/LICENSE', raizPublica)).size > 500);
});

console.log(`${casos} casos ok`);
