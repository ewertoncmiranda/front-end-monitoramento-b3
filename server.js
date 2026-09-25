// Ponto de entrada: serve os arquivos estaticos de public/ e registra o
// proxy reverso para o backend real. Nao contem regra de negocio nenhuma.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverBackendUrl } from './proxy/backendConfig.js';
import { registrarProxy } from './proxy/apiProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

async function iniciar() {
  const app = express();
  const backendUrl = await resolverBackendUrl(console);

  registrarProxy(app, backendUrl);
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(PORT, () => {
    console.log(`[server] Painel de Ativos B3 rodando na porta ${PORT} (backend: ${backendUrl})`);
  });
}

iniciar();
