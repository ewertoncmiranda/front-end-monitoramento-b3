/**
 * F360-PAI-9: Testes da linha do tempo
 */

import { montarLinhaDoTempo, filtrarPorTipo } from '../../public/js/analise/ficha360/linhaDoTempo.js';

console.log('Testando linha do tempo...');

// Teste 1: Juntar comunicados e notícias
console.log('Teste 1: Juntar comunicados e notícias...');
const dados = {
  comunicados: [
    { data_entrega: '2024-01-10', titulo: 'Fato Relevante', tipo: 'FATO RELEVANTE' },
    { data_entrega: '2024-01-05', titulo: 'DFP', tipo: 'DFP' },
  ],
  noticias: [
    { data_publicacao: '2024-01-08', titulo: 'Notícia A' },
    { data_publicacao: '2024-01-03', titulo: 'Notícia B' },
  ],
};

const eventos = montarLinhaDoTempo(dados);
if (eventos.length !== 4) {
  throw new Error(`Esperado 4 eventos, recebido ${eventos.length}`);
}
console.log('✓ Teste 1 passou');

// Teste 2: Ordenação por data decrescente
console.log('Teste 2: Ordenação por data decrescente...');
if (eventos[0].dataIso !== '2024-01-10') {
  throw new Error('Primeiro evento deve ser 2024-01-10');
}
if (eventos[eventos.length - 1].dataIso !== '2024-01-03') {
  throw new Error('Último evento deve ser 2024-01-03');
}
console.log('✓ Teste 2 passou');

// Teste 3: Filtrar por tipo
console.log('Teste 3: Filtrar por tipo...');
const comunicados = filtrarPorTipo(eventos, 'comunicado');
if (comunicados.length !== 2) {
  throw new Error(`Esperado 2 comunicados, recebido ${comunicados.length}`);
}
const noticias = filtrarPorTipo(eventos, 'noticia');
if (noticias.length !== 2) {
  throw new Error(`Esperado 2 notícias, recebido ${noticias.length}`);
}
const todos = filtrarPorTipo(eventos, 'todos');
if (todos.length !== 4) {
  throw new Error(`Esperado 4 com filtro todos, recebido ${todos.length}`);
}
console.log('✓ Teste 3 passou');

// Teste 4: Dados vazios
console.log('Teste 4: Dados vazios...');
const vazios = montarLinhaDoTempo({ comunicados: [], noticias: [] });
if (vazios.length !== 0) {
  throw new Error('Dados vazios devem retornar array vazio');
}
console.log('✓ Teste 4 passou');

// Teste 5: Null preservado
console.log('Teste 5: Null preservado...');
const nulos = montarLinhaDoTempo({ comunicados: null, noticias: null });
if (nulos.length !== 0) {
  throw new Error('Dados null devem retornar array vazio');
}
console.log('✓ Teste 5 passou');

// Teste 6: Ícones de comunicados
console.log('Teste 6: Ícones de comunicados...');
const eventoFato = eventos.find((e) => e.titulo === 'Fato Relevante');
if (!eventoFato || eventoFato.icone !== '⚠️') {
  throw new Error('Fato Relevante deve ter ícone ⚠️');
}
const eventoDfp = eventos.find((e) => e.titulo === 'DFP');
if (!eventoDfp || eventoDfp.icone !== '📊') {
  throw new Error('DFP deve ter ícone 📊');
}
console.log('✓ Teste 6 passou');

console.log('\n✅ Todos os testes de linha do tempo passaram!');
