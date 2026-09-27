// Unica responsabilidade: indexar o texto estatico da plataforma (glossario,
// padroes de vela, trilhas de estudo) para a busca global do cabecalho.
//
// So conteudo estatico e conhecido de antemao entra aqui - nada que venha de
// API (cotacoes, insights, comunicados). Cada fonte ja e um modulo de dados
// existente, reaproveitado sem duplicar texto.
import { GLOSSARIO } from '../pages/GlossarioPage.js';
import { glossarioAcademico } from '../estudos/glossarioAcademico.js';
import { PADROES_DETALHADOS } from '../estudos/glossarioPadroes.js';
import { niveis, apimec, conhecimentos, orientacoes } from '../estudos/conteudo.js';
import { normalizar } from '../estudos/texto.js';

const LIMITE_PADRAO = 8;

function itemDeTermo(t, categoria) {
  const trecho = t.definicao || t.exemplo || '';
  return {
    categoria,
    titulo: t.termo,
    trecho,
    indice: normalizar([t.termo, t.sigla, t.definicao, t.exemplo, t.cuidado, t.onde].filter(Boolean).join(' ')),
    rota: `#/glossario?q=${encodeURIComponent(t.termo)}`,
  };
}

function itemDePadrao(p) {
  return {
    categoria: 'Padrões',
    titulo: p.termo,
    trecho: p.indica || p.fundamento || '',
    indice: normalizar([p.termo, p.fundamento, p.indica, ...(p.cenarios || [])].join(' ')),
    rota: `#/glossario?padrao=${encodeURIComponent(p.id)}`,
  };
}

function itemDeEstudo(e, categoria) {
  const trecho = e.foco || e.descricao || e.texto || '';
  return {
    categoria,
    titulo: e.titulo,
    trecho,
    indice: normalizar([e.titulo, e.foco, e.pergunta, e.descricao, e.texto, ...(e.topicos || [])].filter(Boolean).join(' ')),
    rota: '#/estudos',
  };
}

let indiceCompleto = null;

function construirIndice() {
  const verbetes = [...GLOSSARIO, ...glossarioAcademico]
    .flatMap((grupo) => grupo.termos.map((t) => itemDeTermo(t, grupo.titulo)));
  const padroes = PADROES_DETALHADOS.map(itemDePadrao);
  const trilhas = [...niveis, ...apimec].map((n) => itemDeEstudo(n, 'Formações'));
  const conceitos = conhecimentos.map((c) => itemDeEstudo(c, 'Conhecimento'));
  const guias = orientacoes.map((o) => itemDeEstudo(o, 'Orientações'));
  return [...verbetes, ...padroes, ...trilhas, ...conceitos, ...guias];
}

/** Busca por texto simples (sem acento, sem caixa) em titulo e conteudo indexado. */
export function buscarNaPlataforma(termo, limite = LIMITE_PADRAO) {
  const query = normalizar((termo || '').trim());
  if (!query) return [];
  if (!indiceCompleto) indiceCompleto = construirIndice();

  const noTitulo = [];
  const noConteudo = [];
  for (const item of indiceCompleto) {
    if (normalizar(item.titulo).includes(query)) noTitulo.push(item);
    else if (item.indice.includes(query)) noConteudo.push(item);
    if (noTitulo.length >= limite) break;
  }
  return [...noTitulo, ...noConteudo].slice(0, limite);
}
