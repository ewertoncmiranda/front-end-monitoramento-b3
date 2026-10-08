// Unica responsabilidade: transformar o texto de um fluxo Server-Sent Events
// (CTR-IA-02, insider-ia SPEC 13.3) em eventos {evento, dados}. Puro: nao faz
// rede. Os pedacos chegam em qualquer ponto do texto (um evento partido em dois
// pedacos, ou varios eventos num pedaco so), entao guarda o resto entre chamadas.

/** Evento local quando o servico manda `data` que nao e JSON. */
export const CODIGO_RESPOSTA_INVALIDA = 'RESPOSTA_INVALIDA';

export function criarLeitorSSE() {
  let resto = '';

  function blocoParaEvento(bloco) {
    let evento = 'message';
    const linhasDeDados = [];
    for (const linha of bloco.split('\n')) {
      if (!linha || linha.startsWith(':')) continue; // comentario/keep-alive
      const separador = linha.indexOf(':');
      const campo = separador === -1 ? linha : linha.slice(0, separador);
      let valor = separador === -1 ? '' : linha.slice(separador + 1);
      if (valor.startsWith(' ')) valor = valor.slice(1);
      if (campo === 'event') evento = valor;
      else if (campo === 'data') linhasDeDados.push(valor);
    }
    if (linhasDeDados.length === 0) return null;
    const texto = linhasDeDados.join('\n');
    try {
      return { evento, dados: JSON.parse(texto) };
    } catch {
      return {
        evento: 'erro',
        dados: { codigo: CODIGO_RESPOSTA_INVALIDA, mensagem: 'O assistente mandou uma resposta ilegível.' },
      };
    }
  }

  /** Acrescenta um pedaco do fluxo e devolve os eventos completos que ele fechou. */
  function alimentar(pedaco) {
    resto += String(pedaco).replace(/\r\n?/g, '\n');
    const blocos = resto.split('\n\n');
    resto = blocos.pop();
    return blocos.map(blocoParaEvento).filter(Boolean);
  }

  /** Fim do fluxo: um ultimo evento sem a linha em branco final ainda conta. */
  function finalizar() {
    const ultimo = resto.trim() ? blocoParaEvento(resto) : null;
    resto = '';
    return ultimo ? [ultimo] : [];
  }

  return { alimentar, finalizar };
}

/** Conveniencia para um texto completo (testes e respostas pequenas). */
export function lerEventosSSE(texto) {
  const leitor = criarLeitorSSE();
  return [...leitor.alimentar(texto), ...leitor.finalizar()];
}
