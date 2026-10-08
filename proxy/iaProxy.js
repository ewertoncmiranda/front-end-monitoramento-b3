// Unica responsabilidade: encaminhar /ia/* do painel para o servico de IA
// (ia-opiniao, repo insider-ia, SPEC 13.3; DEC-IA-07), sem passar pelo gestor.
// O prefixo /ia e removido: /ia/chat -> /chat, /ia/ativo/WEGE3 -> /ativo/WEGE3.
// A resposta do chat e SSE: o proxy repassa em fluxo, sem acumular.
import { createProxyMiddleware } from 'http-proxy-middleware';

export const IA_URL_PADRAO = 'http://ia-opiniao:8000';
const TIMEOUT_MS = 120_000;

// O painel nao gera opiniao (so o worker tem o dossie; TASK-IA-37 descartada)
// nem reindexa o RAG.
const BLOQUEADAS = [/^\/opiniao(\/|$|\?)/, /^\/indexar(\/|$|\?)/];

export function caminhoBloqueado(caminho) {
  return BLOQUEADAS.some((regra) => regra.test(caminho));
}

export function registrarProxyIa(app, iaUrl = process.env.IA_URL || IA_URL_PADRAO) {
  app.use('/ia', (req, res, next) => {
    if (caminhoBloqueado(req.url)) {
      res.status(403).json({ erro: 'ROTA_NAO_PERMITIDA' });
      return;
    }
    next();
  });
  app.use(
    '/ia',
    createProxyMiddleware({
      target: iaUrl,
      changeOrigin: true,
      proxyTimeout: TIMEOUT_MS,
      timeout: TIMEOUT_MS,
      on: {
        proxyReq: (proxyReq) => {
          // Mesmo motivo do apiProxy.js: chamada same-origin nao precisa de CORS.
          proxyReq.removeHeader('origin');
        },
        error: (erro, req, res) => {
          console.error(`[ia] falha ao encaminhar ${req.originalUrl}: ${erro.message}`);
          // Com o SSE ja iniciado nao da para trocar o status; so encerra.
          if (res.headersSent) {
            res.end();
            return;
          }
          res.writeHead(503, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ erro: 'IA_INDISPONIVEL' }));
        },
      },
    })
  );
}
