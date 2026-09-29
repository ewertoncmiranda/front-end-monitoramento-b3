// Datas e horas exibidas no painel: sempre no horario de Brasilia e no
// formato dd-MM-yyyy (dd-MM-yyyy HH:mm quando ha hora). Unico lugar do
// frontend que conhece fuso e formato - componente nenhum formata data na mao.
//
// Regra de entrada (todos os servicos gravam em UTC, confirmado em
// 2026-09-29: containers e MySQL em UTC):
//   - data pura "2026-09-28" (pregao, periodo)  -> sem conversao de fuso;
//     converter viraria 27-09 as 21h.
//   - data e hora sem fuso "2026-09-28T11:44:53" -> tratada como UTC.
//   - com fuso ("...Z", "...-03:00"), Date ou epoch em ms -> o instante dado.

export const FUSO_BRASILIA = 'America/Sao_Paulo';
const SEPARADOR = '-';

const DATA_PURA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATA_HORA_SEM_FUSO = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

const PARTES = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_BRASILIA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Instante (Date) de um valor da API, ou null quando nao da para ler. */
export function paraInstante(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'number') return new Date(valor);
  let texto = String(valor).trim();
  if (DATA_HORA_SEM_FUSO.test(texto)) {
    // Java LocalDateTime traz ate nanossegundos; o Date so aceita milissegundos.
    texto = `${texto.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1')}Z`;
  }
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

function partesEmBrasilia(instante) {
  const p = Object.fromEntries(PARTES.formatToParts(instante).map((x) => [x.type, x.value]));
  return { dia: p.day, mes: p.month, ano: p.year, hora: p.hour, minuto: p.minute };
}

/** "28-09-2026". Data pura nao muda de dia; data e hora vira o dia em Brasilia. */
export function formatarData(valor, vazio = '-') {
  if (valor === null || valor === undefined || valor === '') return vazio;
  const pura = DATA_PURA.exec(String(valor).trim());
  if (pura) return [pura[3], pura[2], pura[1]].join(SEPARADOR);
  const instante = paraInstante(valor);
  if (!instante) return String(valor);
  const { dia, mes, ano } = partesEmBrasilia(instante);
  return [dia, mes, ano].join(SEPARADOR);
}

/** "28-09-2026 18:14" em Brasilia. Data pura sai so com a data. */
export function formatarDataHora(valor, vazio = '-') {
  if (valor === null || valor === undefined || valor === '') return vazio;
  if (DATA_PURA.test(String(valor).trim())) return formatarData(valor, vazio);
  const instante = paraInstante(valor);
  if (!instante) return String(valor);
  const { dia, mes, ano, hora, minuto } = partesEmBrasilia(instante);
  return `${[dia, mes, ano].join(SEPARADOR)} ${hora}:${minuto}`;
}
