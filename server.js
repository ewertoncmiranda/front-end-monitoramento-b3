// Ponto de entrada: serve os arquivos estaticos de public/ e registra o
// proxy reverso para o backend real. Nao contem regra de negocio nenhuma.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverBackendUrl } from './proxy/backendConfig.js';
import { registrarProxy } from './proxy/apiProxy.js';
import { buscarNoticias } from './proxy/noticiasApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

async function iniciar() {
  const app = express();
  const backendUrl = await resolverBackendUrl(console);

  registrarProxy(app, backendUrl);

  // Nao proxia pro backend Java: e o proprio Node que busca a manchete no
  // Google News RSS (ver proxy/noticiasApi.js) - nao ha regra de negocio
  // nem persistencia aqui, so evitar que o browser bata direto num dominio
  // externo (CORS) e sofra com o XML.
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
