// Unica responsabilidade: conhecer os endpoints /carteiras do gestor
// (CARTDB-GES-1) e traduzir entre o JSON do painel ({ capital }) e o da API
// ({ capitalAlocado }). Nao guarda estado nem decide a fonte dos dados.
import { httpDelete, httpEnviarJson, httpGet } from './httpClient.js';

const ROTA = '/carteiras';
const caminho = (...partes) => [ROTA, ...partes.map((p) => encodeURIComponent(p))].join('/');

/** O gestor recusa capital com mais de 2 casas decimais. */
export function arredondarCapital(valor) {
  return Math.round(Number(valor) * 100) / 100;
}

export function ativoDoServidor(dto) {
  return {
    simbolo: dto.simbolo,
    dataEntrada: dto.dataEntrada ? String(dto.dataEntrada).slice(0, 10) : null,
    capital: dto.capitalAlocado === null || dto.capitalAlocado === undefined ? null : Number(dto.capitalAlocado),
    naturezaCapital: dto.naturezaCapital ?? null,
  };
}

export function carteiraDoServidor(dto) {
  return {
    id: dto.id,
    nome: dto.nome,
    estrategia: dto.estrategia,
    cor: dto.cor,
    moedaBase: dto.moedaBase ?? 'BRL',
    status: dto.status ?? 'ATIVA',
    criadaEm: dto.criadaEm ?? null,
    ativos: (dto.ativos || []).map(ativoDoServidor),
  };
}

const corpoCarteira = ({ nome, estrategia, cor }) => ({ nome, estrategia, cor });

export async function listarCarteiras() {
  return ((await httpGet(ROTA)) || []).map(carteiraDoServidor);
}

export async function criarCarteira(dados) {
  return carteiraDoServidor(await httpEnviarJson('POST', ROTA, corpoCarteira(dados)));
}

export async function atualizarCarteira(id, dados) {
  return carteiraDoServidor(await httpEnviarJson('PUT', caminho(id), corpoCarteira(dados)));
}

/** DELETE arquiva no gestor: a carteira sai da lista, mas o historico fica no banco. */
export function arquivarCarteira(id) {
  return httpDelete(caminho(id));
}

/** Upsert: um registro por ticker em cada carteira; repetir nao duplica. */
export async function salvarAtivo(id, { simbolo, dataEntrada, capital }) {
  const dto = await httpEnviarJson('PUT', caminho(id, 'ativos', String(simbolo).toUpperCase()), {
    dataEntrada,
    capitalAlocado: arredondarCapital(capital),
  });
  return ativoDoServidor(dto);
}

export function removerAtivo(id, simbolo) {
  return httpDelete(caminho(id, 'ativos', String(simbolo).toUpperCase()));
}

/**
 * Importa o store do navegador (b3-carteiras) mantendo os ids locais. O gestor
 * grava tudo ou nada e reconhece reenvio identico (jaExistentes) - repetir e seguro.
 * Resposta: { hashConteudo, importadas, jaExistentes, idsCarteira }.
 */
export function importarCarteiras(payload) {
  return httpEnviarJson('POST', `${ROTA}/importacoes`, payload);
}

/** Prefere o `motivo` do gestor (corpo do erro); sem ele, a mensagem sai do status. */
export function mensagemDeErro(erro) {
  if (erro?.motivo && [400, 409, 422].includes(erro.status)) return `O gestor recusou: ${erro.motivo}`;
  switch (erro?.status) {
    case 0: return erro.message || 'Sem conexão com o gestor.';
    case 400: return 'O gestor recusou os dados (confira nome, estratégia, cor, data e capital).';
    case 404: return 'O gestor não encontrou a carteira (ou ainda não tem a API de carteiras).';
    case 409: return 'O gestor já tem uma carteira com o mesmo id e conteúdo diferente (editada depois de importada?). Nada foi gravado.';
    case 503: return 'O banco do gestor ainda não tem as tabelas de carteiras (migration V42).';
    default: return erro?.message || 'Falha ao falar com o gestor.';
  }
}
