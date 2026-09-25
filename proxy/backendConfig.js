// Unica responsabilidade: resolver a URL do backend real (gestor-ativos-brutos),
// validando por healthcheck e caindo para um fallback quando o primario nao responde.
// Nao sabe nada sobre proxy, rotas ou HTTP do lado do cliente.
import http from 'node:http';

const TIMEOUT_MS = 2000;

function verificarSaude(baseUrl) {
  return new Promise((resolve) => {
    const req = http.get(`${baseUrl}/actuator/health`, { timeout: TIMEOUT_MS }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

// Resolve, nesta ordem: BACKEND_URL (ex.: nome do servico dentro do docker-compose)
// -> BACKEND_URL_FALLBACK (ex.: localhost, quando o container roda solto) -> BACKEND_URL
// mesmo sem confirmar (modo degradado: o front sobe, o proxy so vai falhar nas
// chamadas de API ate o backend ficar disponivel).
export async function resolverBackendUrl(logger = console) {
  const primario = process.env.BACKEND_URL || 'http://gestor-ativos-brutos:8091';
  const fallback = process.env.BACKEND_URL_FALLBACK || 'http://localhost:8091';

  if (await verificarSaude(primario)) {
    logger.log(`[backend-config] Usando backend primario: ${primario}`);
    return primario;
  }

  logger.warn(`[backend-config] Backend primario (${primario}) nao respondeu; tentando fallback (${fallback}).`);

  if (await verificarSaude(fallback)) {
    logger.log(`[backend-config] Usando backend fallback: ${fallback}`);
    return fallback;
  }

  logger.warn(
    `[backend-config] Nenhum backend respondeu (primario=${primario}, fallback=${fallback}). ` +
      'Subindo mesmo assim, em modo degradado - as chamadas de API vao falhar ate o backend ficar disponivel.'
  );
  return primario;
}
