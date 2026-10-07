// Unica responsabilidade: converter o estado visivel de Estudos (secao, visao,
// curso aberto, busca e filtros) em hash compartilhavel e de volta (ISS-11).
// Modulo puro: valida contra listas conhecidas, entrada invalida e ignorada.

const SECOES = ['formacoes', 'conhecimento'];
const VISOES = ['planos', 'biblioteca'];
const ROTA = '#/estudos';

/** Estado a partir de "#/estudos?secao=formacoes&curso=x". `idsCursos` valida o curso. */
export function lerEstado(hash, idsCursos = []) {
  const [rota, consulta = ''] = String(hash || '').split('?');
  if (rota !== ROTA) return {};
  const p = new URLSearchParams(consulta);
  const estado = {};
  if (SECOES.includes(p.get('secao'))) estado.secao = p.get('secao');
  if (VISOES.includes(p.get('visao'))) estado.visao = p.get('visao');
  if (idsCursos.includes(p.get('curso'))) {
    estado.curso = p.get('curso');
    estado.secao = 'formacoes';
  }
  for (const campo of ['q', 'nivel', 'tipo']) {
    const valor = (p.get(campo) || '').slice(0, 80);
    if (valor) estado[campo] = valor;
  }
  return estado;
}

/** Hash para o estado atual; so inclui o que foge do padrao. */
export function montarHash({ secao, visao, curso, q, nivel, tipo } = {}) {
  const p = new URLSearchParams();
  if (secao && secao !== 'formacoes') p.set('secao', secao);
  if (visao && visao !== 'planos') p.set('visao', visao);
  if (curso) p.set('curso', curso);
  if (q) p.set('q', q);
  if (nivel) p.set('nivel', nivel);
  if (tipo) p.set('tipo', tipo);
  const consulta = p.toString();
  return consulta ? `${ROTA}?${consulta}` : ROTA;
}
