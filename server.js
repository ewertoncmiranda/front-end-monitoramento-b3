// Ponto de entrada: serve os arquivos estaticos de public/ e registra o
// proxy reverso para o backend real. Nao contem regra de negocio nenhuma.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverBackendUrl } from './proxy/backendConfig.js';
import { registrarProxy } from './proxy/apiProxy.js';
import { registrarProxyIa } from './proxy/iaProxy.js';
import { buscarNoticias } from './proxy/noticiasApi.js';
import { noticiasFavoritos } from './proxy/noticiasFavoritos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

async function iniciar() {
  const app = express();
  const backendUrl = await resolverBackendUrl(console);

  registrarProxy(app, backendUrl);
  registrarProxyIa(app);

  // Nao proxia pro backend Java: e o proprio Node que busca a manchete no
  // Google News RSS (ver proxy/noticiasApi.js) - nao ha regra de negocio
  // nem persistencia aqui, so evitar que o browser bata direto num dominio
  // externo (CORS) e sofra com o XML.
  // CTR-PAI-NOT-01: agrega manchetes dos favoritos com cache e deduplicacao.
  // ?simbolos=PETR4,WEGE3  (1-12 tickers validos, ^[A-Z]{4}[0-9]{1,2}$)
  // &nomes=Petrobras,WEG   (opcional, mesma ordem, refina a busca)
  const TICKER_RE = /^[A-Z]{4}[0-9]{1,2}$/;
  app.get('/noticias/favoritos', async (req, res) => {
    const simbolosParam = String(req.query.simbolos || '').trim();
    if (!simbolosParam) return res.status(400).json({ erro: 'simbolos obrigatorio' });

    const candidatos = simbolosParam.split(',').map((s) => s.trim().toUpperCase());
    const invalidos = candidatos.filter((s) => !TICKER_RE.test(s));
    if (invalidos.length > 0) {
      return res.status(400).json({ erro: 'ticker invalido', tickers: invalidos });
    }
    const simbolos = candidatos.slice(0, 12);
    const nomesRaw = String(req.query.nomes || '').split(',').map((n) => n.trim());
    const nomeMap = new Map(simbolos.map((s, i) => [s, nomesRaw[i] || null]));

    try {
      const resultado = await noticiasFavoritos(simbolos, {
        buscar: (ticker) => buscarNoticias(ticker, { nome: nomeMap.get(ticker) }),
      });
      res.json(resultado);
    } catch (erro) {
      console.error(`[noticias/favoritos] ${erro.message}`);
      res.status(502).json({ erro: 'falha ao buscar manchetes' });
    }
  });

  app.get('/noticias/:ticker', async (req, res) => {
    try {
      const noticias = await buscarNoticias(req.params.ticker);
      res.json(noticias);
    } catch (erro) {
      console.error(`[noticias] falha ao buscar "${req.params.ticker}": ${erro.message}`);
      res.status(502).json([]);
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(PORT, () => {
    console.log(`[server] Painel de Ativos B3 rodando na porta ${PORT} (backend: ${backendUrl})`);
  });
}

iniciar();
