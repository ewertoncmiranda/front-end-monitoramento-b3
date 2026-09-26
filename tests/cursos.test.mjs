import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cursos, obterCurso } from '../public/js/estudos/cursos.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = new Set(cursos.map(curso => curso.id));

assert.equal(cursos.length, 9, 'Cada um dos nove PDFs deve originar um curso.');
assert.equal(ids.size, cursos.length, 'Os IDs dos cursos devem ser únicos.');

for (const curso of cursos) {
  assert.equal(obterCurso(curso.id), curso, `O curso ${curso.id} deve ser recuperável.`);
  assert.ok(curso.titulo && curso.descricao && curso.autoria, `${curso.id} deve documentar identidade e descrição.`);
  assert.ok(curso.modulos.length > 0, `${curso.id} deve ter módulos.`);
  assert.ok(fs.existsSync(path.join(raiz, 'public', curso.pdf)), `PDF ausente: ${curso.pdf}`);

  for (const modulo of curso.modulos) {
    assert.ok(modulo.titulo && modulo.aulas.length > 0, `${curso.id} contém módulo incompleto.`);
    for (const aula of modulo.aulas) {
      assert.ok(aula.titulo && aula.objetivo && aula.atividade, `${curso.id} contém aula incompleta.`);
      assert.ok(aula.topicos.length > 0, `${curso.id}/${aula.titulo} deve conter tópicos.`);
      assert.ok(aula.paginas[0] >= 1 && aula.paginas[1] <= curso.paginas, `${curso.id}/${aula.titulo} referencia páginas inválidas.`);
      assert.ok(aula.paginas[0] <= aula.paginas[1], `${curso.id}/${aula.titulo} tem intervalo invertido.`);
    }
  }
}

console.log('  ok  nove cursos documentais, PDFs e referências de páginas validados');
