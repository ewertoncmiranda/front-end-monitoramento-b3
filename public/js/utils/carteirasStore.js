// CART-PAI-1 — store de carteiras em localStorage.
// Sem dependências externas; puro CRUD sobre a chave b3-carteiras.

const CHAVE = 'b3-carteiras';

function _carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return { carteiras: [] };
    return JSON.parse(raw);
  } catch {
    return { carteiras: [] };
  }
}

function _salvar(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // silently fail (e.g. private mode, quota exceeded)
  }
}

/**
 * @returns {Carteira[]}
 */
export function listarCarteiras() {
  return _carregar().carteiras ?? [];
}

/**
 * @param {string} id
 * @returns {Carteira | null}
 */
export function obterCarteira(id) {
  const lista = listarCarteiras();
  return lista.find((c) => c.id === id) ?? null;
}

/**
 * @param {{ nome: string, estrategia: string, cor: string }} dados
 * @returns {Carteira}
 */
export function criarCarteira({ nome, estrategia, cor }) {
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const nova = {
    id,
    nome,
    estrategia,
    cor,
    criadaEm: new Date().toISOString(),
    ativos: [],
  };
  const armazenado = _carregar();
  armazenado.carteiras = [...(armazenado.carteiras ?? []), nova];
  _salvar(armazenado);
  return nova;
}

/**
 * @param {string} id
 * @param {Partial<Carteira>} campos
 * @returns {Carteira}
 */
export function atualizarCarteira(id, campos) {
  const armazenado = _carregar();
  const idx = (armazenado.carteiras ?? []).findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Carteira não encontrada: ${id}`);
  const atualizada = { ...armazenado.carteiras[idx], ...campos };
  armazenado.carteiras[idx] = atualizada;
  _salvar(armazenado);
  return atualizada;
}

/**
 * @param {string} id
 * @returns {void}
 */
export function removerCarteira(id) {
  const armazenado = _carregar();
  armazenado.carteiras = (armazenado.carteiras ?? []).filter((c) => c.id !== id);
  _salvar(armazenado);
}

/**
 * @param {string} carteiraId
 * @param {{ simbolo: string, dataEntrada: string, capital: number }} ativo
 * @returns {Ativo}
 */
export function adicionarAtivo(carteiraId, { simbolo, dataEntrada, capital }) {
  const armazenado = _carregar();
  const carteiras = armazenado.carteiras ?? [];
  const idx = carteiras.findIndex((c) => c.id === carteiraId);
  if (idx === -1) throw new Error(`Carteira não encontrada: ${carteiraId}`);
  const novoAtivo = { simbolo, dataEntrada, capital };
  carteiras[idx].ativos = [...(carteiras[idx].ativos ?? []), novoAtivo];
  armazenado.carteiras = carteiras;
  _salvar(armazenado);
  return novoAtivo;
}

/**
 * @param {string} carteiraId
 * @param {string} simbolo
 * @returns {void}
 */
export function removerAtivo(carteiraId, simbolo) {
  const armazenado = _carregar();
  const carteiras = armazenado.carteiras ?? [];
  const idx = carteiras.findIndex((c) => c.id === carteiraId);
  if (idx === -1) return;
  carteiras[idx].ativos = (carteiras[idx].ativos ?? []).filter((a) => a.simbolo !== simbolo);
  armazenado.carteiras = carteiras;
  _salvar(armazenado);
}
