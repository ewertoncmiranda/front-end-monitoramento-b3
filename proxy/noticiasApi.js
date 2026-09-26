// Unica responsabilidade: buscar manchetes de mercado por ticker no Google
// News RSS - sem chave, sem custo, sem cadastro (rota nao-oficial do Google,
// mas estavel e ja usada assim por varios projetos abertos). O server.js
// expoe isso como /noticias/{ticker} pro front chamar sem se preocupar com
// CORS nem com o formato XML.
//
// Isso e complementar aos Comunicados oficiais da CVM (ComunicadoController,
// no backend Java): aqui e "o que a midia esta noticiando sobre o ativo",
// la e "o que a empresa e obrigada por lei a publicar". Um nao substitui o
// outro.
const TIMEOUT_MS = 5000;
const LIMITE_ITENS = 8;

export async function buscarNoticias(ticker) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(ticker)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(url, { signal: controller.signal });
    if (!resposta.ok) {
      throw new Error(`Google News RSS respondeu HTTP ${resposta.status}`);
    }
    const xml = await resposta.text();
    return extrairItens(xml).slice(0, LIMITE_ITENS);
  } finally {
    clearTimeout(timeout);
  }
}

function extrairItens(xml) {
  return xml
    .split('<item>')
    .slice(1)
    .map((bloco) => {
      const titulo = extrairTag(bloco, 'title');
      const link = extrairTag(bloco, 'link');
      if (!titulo || !link) {
        // Item mal formado (formato do Google mudou nesse bloco): pula so
        // este item, nao derruba a resposta inteira.
        return null;
      }
      return {
        titulo: decodificarEntidades(titulo),
        link,
        fonte: decodificarEntidades(extrairTag(bloco, 'source') || ''),
        publicadoEm: extrairTag(bloco, 'pubDate'),
      };
    })
    .filter(Boolean);
}

function extrairTag(bloco, tag) {
  const casamento = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!casamento) {
    return null;
  }
  return casamento[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function decodificarEntidades(texto) {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
