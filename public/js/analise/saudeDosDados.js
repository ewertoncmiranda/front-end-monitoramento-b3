// Unica responsabilidade: regras de leitura da saude dos dados
// (/validacao/saude-dados, infra#CTR-12). Modulo puro, sem DOM.

export const ESTADO_FONTE = {
  OK: { rotulo: 'Em dia', classe: 'text-bg-success' },
  ATRASADA: { rotulo: 'Atrasada', classe: 'text-bg-danger' },
  SEM_DADO: { rotulo: 'Nunca rodou', classe: 'text-bg-secondary' },
  ERRO: { rotulo: 'Erro', classe: 'text-bg-danger' },
};

export const ESTADO_GERAL = {
  OK: { rotulo: 'Dados confiáveis', classe: 'alert-success' },
  ATENCAO: { rotulo: 'Atenção', classe: 'alert-warning' },
  PROBLEMA: { rotulo: 'Problema', classe: 'alert-danger' },
};

/** "há 3 h", "há 2 dias"; null vira "—". */
export function formatarIdade(horas) {
  if (horas === null || horas === undefined) return '—';
  if (horas < 1) return 'agora há pouco';
  if (horas < 48) return `há ${horas} h`;
  return `há ${Math.round(horas / 24)} dias`;
}

export function formatarPrazo(horas) {
  return horas < 48 ? `${horas} h` : `${Math.round(horas / 24)} dias`;
}

/** Ativos com pendencia primeiro, os com mais pendencias no topo. */
export function ativosComPendencia(ativos) {
  return (ativos || [])
    .filter((a) => a.problemas && a.problemas.length)
    .sort((a, b) => b.problemas.length - a.problemas.length || (a.simbolo < b.simbolo ? -1 : 1));
}

/** Fração em texto "12 de 31". */
export function deTotal(parte, total) {
  return `${parte} de ${total}`;
}
