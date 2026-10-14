// Unica responsabilidade: regras de exibicao da tela Operabilidade (Plano OPR, OPR-PAI-2..5). Puro.
// O status diz se o paper trading tem evidencia minima. Sem aviso regulatorio (DEC-F360-1): so o
// fato de que e simulacao.
import { StatusOperacional } from '../contracts/statusOperacional.js';

export const PREGOES_MINIMOS = 63;
export const AVISO_SIMULACAO = 'Simulação (paper trading): nenhuma ordem real é enviada.';

export const STATUS = Object.freeze({
  [StatusOperacional.NAO_OPERAVEL]: {
    rotulo: 'Não operável', classe: 'text-bg-secondary',
    descricao: 'Ainda não há evidência mínima: o diário simulado não começou ou tem poucos pregões.',
  },
  [StatusOperacional.EM_OBSERVACAO]: {
    rotulo: 'Em observação', classe: 'text-bg-info',
    descricao: 'O diário simulado está coletando pregões; a avaliação só vale depois do mínimo.',
  },
  [StatusOperacional.PAPER_TRADING_ELEGIVEL]: {
    rotulo: 'Paper trading elegível', classe: 'text-bg-success',
    descricao: 'Cumpriu os critérios no período mínimo: vale continuar a simulação. Não autoriza capital real.',
  },
  [StatusOperacional.BLOQUEADO]: {
    rotulo: 'Bloqueado', classe: 'text-bg-danger',
    descricao: 'Algum limite foi violado (dados do dia, drawdown ou liquidez): a simulação está em pausa.',
  },
});

export const MOTIVO_SAIDA = Object.freeze({
  EVENTO: 'Evento (fato relevante ou salto sem ajuste)', STOP: 'Stop', LIQUIDEZ: 'Perda de liquidez',
  SINAL: 'Sinal deixou de sustentar a tese', PRAZO: 'Fim do horizonte',
});

// Grupos de bloqueio para o filtro (codigos da elegibilidade, OPR-INS-1, e do sizing, OPR-INS-2).
export const GRUPOS_BLOQUEIO = Object.freeze({
  LIQUIDEZ: ['SEM_METRICA_LIQUIDEZ', 'HISTORICO_INSUFICIENTE', 'VOLUME_BAIXO', 'NEGOCIOS_BAIXOS',
    'PRESENCA_BAIXA', 'SPREAD_ALTO', 'SPREAD_AUSENTE'],
  DADO: ['SEM_ATR', 'SERIE_SEM_AJUSTE'],
  EVENTO: ['EVENTO_CORPORATIVO_RECENTE', 'FATO_RELEVANTE_RECENTE'],
  FUNDAMENTO: ['SEM_FUNDAMENTO_VIGENTE'],
  RISCO: ['POSICAO_ABAIXO_DO_MINIMO', 'LIMITE_POSICOES', 'LIMITE_SETOR', 'SEM_CAIXA'],
});
export const ROTULO_GRUPO = Object.freeze({
  LIQUIDEZ: 'Liquidez', DADO: 'Dado ausente', EVENTO: 'Evento', FUNDAMENTO: 'Fundamento', RISCO: 'Limite de risco',
  OUTRO: 'Outro',
});

const numero = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/** Status conhecido ou NAO_OPERAVEL (nunca inventa um rotulo mais otimista). */
export function statusDe(valor) {
  return STATUS[valor] ? valor : StatusOperacional.NAO_OPERAVEL;
}

/** Progresso rumo ao minimo de pregoes (0..1) e texto "12 de 63 pregões". */
export function progresso(pregoesAvaliados, minimo = PREGOES_MINIMOS) {
  const n = Math.max(0, numero(pregoesAvaliados) || 0);
  return { fracao: Math.min(1, n / minimo), texto: `${n} de ${minimo} pregões` };
}

/** Venceu o CDI liquido? true/false, ou null sem dado (nunca trata ausencia como empate). */
export function venceuCdi(resumo) {
  const excesso = numero(resumo?.excessoSobreCdiLiquido);
  return excesso === null ? null : excesso > 0;
}

export function grupoDoMotivo(codigo) {
  return Object.keys(GRUPOS_BLOQUEIO).find((g) => GRUPOS_BLOQUEIO[g].includes(codigo)) || 'OUTRO';
}

/** Bloqueios filtrados por grupo de motivo e simbolo (prefixo, sem caixa). */
export function filtrarBloqueios(itens, { grupo = '', simbolo = '' } = {}) {
  const alvo = String(simbolo || '').trim().toUpperCase();
  return (itens || []).filter((b) => (!alvo || String(b.simbolo || '').toUpperCase().startsWith(alvo))
    && (!grupo || (b.motivos || []).some((m) => grupoDoMotivo(m.codigo) === grupo)));
}

/** Contagem por grupo (para os chips do filtro). */
export function contarPorGrupo(itens) {
  const contagem = {};
  for (const b of itens || []) {
    for (const g of new Set((b.motivos || []).map((m) => grupoDoMotivo(m.codigo)))) contagem[g] = (contagem[g] || 0) + 1;
  }
  return contagem;
}

/** Separa a carteira em abertas (inclui PENDENTE) e fechadas, das mais recentes para as mais antigas. */
export function separarCarteira(itens) {
  const data = (o) => String(o.dataSaida || o.dataEntrada || o.dataDecisaoEntrada || '');
  const ordenar = (a, b) => (data(a) < data(b) ? 1 : data(a) > data(b) ? -1 : 0);
  return {
    abertas: (itens || []).filter((o) => o.status === 'ABERTA' || o.status === 'PENDENTE').sort(ordenar),
    fechadas: (itens || []).filter((o) => o.status === 'FECHADA').sort(ordenar),
  };
}

/** Leitura compacta usada nos cards/listagem da Operabilidade V2. */
export function resumoOperacionalTicker(dados) {
  if (!dados) return null;
  const status = statusDe(dados.statusOperacional || dados.statusSistema);
  const confianca = dados.confiancaFaixa ?? dados.confianca ?? dados.confiancaPrincipal ?? null;
  const motivos = dados.motivosBloqueio || dados.bloqueios || [];
  const tecnico = dados.sinalTecnico && typeof dados.sinalTecnico === 'object'
    ? Object.entries(dados.sinalTecnico).filter(([, valor]) => valor).map(([chave, valor]) => `${chave}: ${valor}`).join(' · ')
    : dados.sinalTecnico || dados.tecnico?.sinal || null;
  return {
    status,
    statusRotulo: STATUS[status].rotulo,
    statusClasse: STATUS[status].classe,
    liquidez: dados.faixaLiquidez || dados.liquidez || null,
    risco: dados.risco || dados.nivelRisco || null,
    confianca,
    confiancaCalibrada: dados.confiancaCalibrada === true
      || ['ALTA', 'MEDIA', 'BAIXA'].includes(dados.confiancaFaixa),
    sinalPrincipal: dados.sinalPrincipal || dados.regraPrincipal?.sinal || null,
    sinalTecnico: tecnico,
    sinalIa: dados.sinalIa || dados.opiniaoIa || dados.ia?.sinal || null,
    ultimoEvento: dados.ultimoEvento || dados.ultimoEventoTipo || null,
    bloqueado: status === 'BLOQUEADO' || dados.bloqueado === true || Boolean(dados.motivoBloqueio) || motivos.length > 0,
    motivoBloqueio: dados.motivoBloqueio || motivos[0]?.descricao || motivos[0]?.detalhe || motivos[0]?.codigo || null,
  };
}
