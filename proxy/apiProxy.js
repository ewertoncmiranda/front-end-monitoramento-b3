// Unica responsabilidade: registrar o proxy reverso das rotas do
// gestor-ativos-brutos consumidas por este front. Nao decide qual e o
// backend (isso e do backendConfig.js), so aplica o proxy nas rotas certas.
import { createProxyMiddleware } from 'http-proxy-middleware';

const ROTAS_PROXIADAS = ['/ativos', '/analises', '/api'];

export function registrarProxy(app, backendUrl) {
  for (const rota of ROTAS_PROXIADAS) {
    app.use(
      rota,
      createProxyMiddleware({
        target: backendUrl,
        changeOrigin: true,
        // Express remove o prefixo da rota (ex.: /analises) antes de chamar o
        // middleware; sem isso o proxy reenviaria so "/PETR4/analise" para o backend.
        pathRewrite: (path) => rota + path,
      })
    );
  }
}
