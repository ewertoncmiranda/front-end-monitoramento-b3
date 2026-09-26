// Unica responsabilidade: registrar o proxy reverso das rotas do
// gestor-ativos-brutos consumidas por este front. Nao decide qual e o
// backend (isso e do backendConfig.js), so aplica o proxy nas rotas certas.
import { createProxyMiddleware } from 'http-proxy-middleware';

const ROTAS_PROXIADAS = ['/ativos', '/analises', '/api', '/setores', '/indices-macro'];

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
        on: {
          proxyReq: (proxyReq) => {
            // O backend tem CORS proprio (para outros clientes). Sem remover o
            // Origin aqui, o browser manda esse header em requisicoes POST/PUT/DELETE
            // mesmo same-origin, o CORS do backend rejeita com 403 se a porta do
            // front nao estiver na allowlist dele - justamente o que o proxy deveria
            // tornar desnecessario.
            proxyReq.removeHeader('origin');
          },
        },
      })
    );
  }
}
