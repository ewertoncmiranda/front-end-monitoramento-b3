// Unica responsabilidade: cliente HTTP do panorama do mercado no gestor
// (GET /mercado/panorama, Plano MERC). Nao calcula nada: devolve o JSON do
// contrato do hub como veio; erro HTTP vira Error com status e corpo.

// Periodos do contrato, contados em pregoes; fora disso o gestor responde 400.
export const JANELAS_PANORAMA = ['1d', '5d', '21d', 'ano'];
export const JANELA_PADRAO = '5d';

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, {
    ...opcoes, headers: { Accept: 'application/json', ...opcoes.headers },
  });
  const texto = await resposta.text();
  let data;
  try { data = texto ? JSON.parse(texto) : null; }
  catch { data = { mensagem: texto }; }
  if (!resposta.ok) {
    const erro = new Error(data?.mensagem || data?.erro || data?.message || `Falha ao consultar o panorama do mercado (${resposta.status})`);
    erro.status = resposta.status;
    erro.data = data;
    erro.body = data;
    throw erro;
  }
  return data;
}

export function buscarPanorama(janela = JANELA_PADRAO, opcoes = {}) {
  const params = new URLSearchParams({ janela: janela || JANELA_PADRAO });
  return requisitar(`/mercado/panorama?${params}`, opcoes);
}
