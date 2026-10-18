// Maior `limite` aceito pelo gestor em GET /cargas (fora de 1..200 ele responde 400).
export const LIMITE_MAXIMO_CARGAS = 200;

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, {
    ...opcoes, headers: { Accept: 'application/json', ...opcoes.headers },
  });
  const texto = await resposta.text();
  let data;
  try { data = texto ? JSON.parse(texto) : null; }
  catch { data = { mensagem: texto }; }
  if (!resposta.ok) {
    const erro = new Error(data?.mensagem || data?.erro || data?.message || `Falha ao consultar cargas (${resposta.status})`);
    erro.status = resposta.status;
    erro.data = data;
    erro.body = data;
    throw erro;
  }
  return data;
}

export function listarCargas(filtros = {}, opcoes = {}) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== null && valor !== undefined && valor !== '') params.set(chave, valor);
  }
  return requisitar(`/cargas${params.size ? '?' + params : ''}`, opcoes);
}

export function obterCarga(id, opcoes = {}) {
  return requisitar(`/cargas/${encodeURIComponent(id)}`, opcoes);
}

export function obterUltimasCargas(opcoes = {}) {
  return requisitar('/cargas/ultimas', opcoes);
}

export const buscarUltimasCargas = obterUltimasCargas;

export function dispararCarga(parametros, opcoes = {}) {
  return requisitar('/cargas', {
    ...opcoes, method: 'POST',
    headers: { 'Content-Type': 'application/json', ...opcoes.headers },
    body: JSON.stringify(parametros),
  });
}
