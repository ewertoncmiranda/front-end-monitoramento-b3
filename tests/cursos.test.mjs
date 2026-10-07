import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cursos, obterCurso } from '../public/js/estudos/cursos.js';
import { glossarioAcademico } from '../public/js/estudos/glossarioAcademico.js';
import { cursosPorEtapa, cursosPorEtapaApimec } from '../public/js/estudos/planosCursos.js';
import { TIPOS_CURSOS, escopoDoCurso, tipoDoCurso } from '../public/js/estudos/tiposCursos.js';
import { renderCatalogoCursos, renderCurso } from '../public/js/estudos/apresentacaoCursos.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = new Set(cursos.map(curso => curso.id));
const dificuldades = new Set(cursos.map(curso => curso.nivel));
const escopos = new Set(cursos.map(escopoDoCurso));

assert.equal(cursos.length, 29, 'Os nove cursos anteriores e os vinte novos documentos únicos devem estar no catálogo.');
assert.equal(ids.size, cursos.length, 'Os IDs dos cursos devem ser únicos.');

for (const curso of cursos) {
  assert.equal(obterCurso(curso.id), curso, `O curso ${curso.id} deve ser recuperável.`);
  assert.ok(curso.titulo && curso.descricao && curso.autoria, `${curso.id} deve documentar identidade e descrição.`);
  assert.ok(curso.modulos.length > 0, `${curso.id} deve ter módulos.`);
  assert.ok(fs.existsSync(path.join(raiz, 'public', curso.pdf)), `PDF ausente: ${curso.pdf}`);
  assert.ok(TIPOS_CURSOS[tipoDoCurso(curso)], `${curso.id} deve possuir um tipo editorial válido.`);
  assert.ok(curso.nivel !== 'Formação completa', `${curso.id} mistura escopo com dificuldade.`);

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

const idsPlanoProgressivo = new Set(Object.values(cursosPorEtapa).flat());
for (const curso of cursos) assert.ok(idsPlanoProgressivo.has(curso.id), `${curso.id} não foi associado ao plano progressivo.`);
for (const id of Object.values(cursosPorEtapaApimec).flat()) assert.ok(ids.has(id), `Curso inexistente no plano APIMEC: ${id}`);

const catalogo = renderCatalogoCursos();
assert.match(catalogo, /data-curso-filtro="nivel"/, 'O catálogo deve filtrar por dificuldade.');
assert.match(catalogo, /data-curso-filtro="escopo"/, 'O catálogo deve filtrar por escopo.');
assert.match(catalogo, /data-curso-filtro="tipo"/, 'O catálogo deve filtrar por tipo.');
assert.match(catalogo, /data-curso-card/, 'Os cards devem expor atributos para filtragem combinada.');
assert.ok(!dificuldades.has('Formação completa'), 'Formação completa deve sair das dificuldades.');
assert.ok(escopos.has('Formação completa'), 'Formação completa deve ser escopo/abrangência.');
assert.match(catalogo, /data-curso-escopo="formacao completa"/, 'Cards devem expor escopo para filtragem.');

const cursoCompleto = obterCurso('mercados-financeiros-ufba');
assert.equal(cursoCompleto.nivel, 'Intermediário');
assert.equal(escopoDoCurso(cursoCompleto), 'Formação completa');
assert.match(renderCurso(cursoCompleto.id), /<span class="badge text-bg-light">Intermediário<\/span><span class="badge text-bg-light">Formação completa<\/span>/, 'Detalhe do curso deve mostrar dificuldade e escopo separados.');

const termos = new Set(glossarioAcademico.flatMap(grupo => grupo.termos.map(item => item.termo)));
for (const termo of ['ETTJ — Estrutura a Termo da Taxa de Juros', 'Contrato futuro', 'VaR — Value at Risk', 'MQO — Mínimos Quadrados Ordinários', 'Microestrutura de mercado']) {
  assert.ok(termos.has(termo), `Termo técnico ausente do glossário: ${termo}`);
}

console.log('  ok  29 cursos documentais, PDFs, metadados, páginas e glossário técnico validados');
