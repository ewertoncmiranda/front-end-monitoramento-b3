// ISS-03: fluxos reais de Estudos que nao dependem do backend.
import assert from 'node:assert/strict';
import { abrirPdf, renderCatalogoCursos } from '../public/js/estudos/apresentacaoCursos.js';
import { ProgressoEstudos } from '../public/js/estudos/progresso.js';
import { cursos } from '../public/js/estudos/cursos.js';
import { niveis, apimec } from '../public/js/estudos/conteudo.js';

function caso(nome, fn) {
  fn();
  console.log(`  ok  ${nome}`);
}

function armazenamentoQueFalha() {
  return {
    getItem() { throw new Error('localStorage indisponivel'); },
    setItem() { throw new Error('quota indisponivel'); },
  };
}

caso('progresso: funciona em memoria quando o armazenamento falha', () => {
  const ids = [...niveis, ...apimec].map(etapa => etapa.id);
  const progresso = new ProgressoEstudos(armazenamentoQueFalha(), ids);
  assert.equal(progresso.persistente, false);
  assert.equal(progresso.proximo(ids), ids[0]);
  progresso.concluir(ids[0], true);
  assert.deepEqual(progresso.resumo(ids), { total: ids.length, concluidos: 1, percentual: 8 });
  assert.equal(progresso.proximo(ids), ids[1]);
  progresso.concluir('id-invalido', true);
  assert.deepEqual(progresso.resumo(ids), { total: ids.length, concluidos: 1, percentual: 8 });
  progresso.concluir(ids[0], false);
  assert.equal(progresso.resumo(ids).concluidos, 0);
});

caso('catalogo: filtros de dificuldade, escopo e tipo expostos nos cards', () => {
  const html = renderCatalogoCursos();
  assert.match(html, /id="curso-filtro-dificuldade"/);
  assert.match(html, /id="curso-filtro-escopo"/);
  assert.match(html, /id="curso-filtro-tipo"/);
  assert.match(html, /data-curso-nivel="intermediario"/);
  assert.match(html, /data-curso-escopo="formacao completa"/);
  assert.match(html, /data-curso-tipo="fundamentos"/);
});

function elementoPdfFake() {
  const classe = new Set(['d-none']);
  const botao = { classe: new Set(['d-none']), classList: { remove(valor) { botao.classe.delete(valor); }, add(valor) { botao.classe.add(valor); } } };
  const secao = {
    querySelector(seletor) {
      assert.equal(seletor, '[data-fechar-pdf]');
      return botao;
    },
    scrollIntoView() {},
  };
  return {
    botao,
    container: {
      innerHTML: '',
      classList: { remove(valor) { classe.delete(valor); }, add(valor) { classe.add(valor); }, contains(valor) { return classe.has(valor); } },
      closest(seletor) {
        assert.equal(seletor, 'section');
        return secao;
      },
    },
  };
}

caso('leitor PDF: abre sob demanda e limita pagina para 1..paginas', () => {
  const curso = cursos.find(item => item.id === 'mercado-futuro-taxas-juros');
  const { container, botao } = elementoPdfFake();

  abrirPdf(container, curso.id, 999);
  assert.equal(container.classList.contains('d-none'), false);
  assert.equal(botao.classe.has('d-none'), false);
  assert.match(container.innerHTML, new RegExp(`${curso.pdf}#page=${curso.paginas}&view=FitH`));

  abrirPdf(container, curso.id, -10);
  assert.match(container.innerHTML, new RegExp(`${curso.pdf}#page=1&view=FitH`));
});

console.log('estudosFluxos.test.mjs ok');
