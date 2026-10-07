// Unica responsabilidade: resolver a URL do backend real (gestor-ativos-brutos),
// validando por healthcheck e caindo para um fallback quando o primario nao responde.
// Nao sabe nada sobre proxy, rotas ou HTTP do lado do cliente.
import http from 'node:http';
import https from 'node:https';

const TIMEOUT_MS = 2000;

// Saudavel = HTTP 2xx do actuator. 3xx/4xx/5xx (inclusive 404, que um servidor
// qualquer na porta devolve) nao contam: escolheriam o backend errado sem alarme.
// Se o corpo for JSON com "status", ele tem de ser UP.
export function saudavel(statusCode, corpo) {
  if (statusCode < 200 || statusCode >= 300) return false;
  try {
    const json = JSON.parse(corpo);
    if (json && typeof json.status === 'string') return json.status === 'UP';
  } catch {
    // corpo nao e JSON: o 2xx basta
  }
  return true;
}

export function verificarSaude(baseUrl) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(`${baseUrl.replace(/\/+$/, '')}/actuator/health`);
    } catch {
      resolve(false);
      return;
    }
    const cliente = url.protocol === 'https:' ? https : http;
    const req = cliente.get(url, { timeout: TIMEOUT_MS }, (res) => {
      let corpo = '';
      res.setEncoding('utf8');
      res.on('data', (parte) => {
        if (corpo.length < 4096) corpo += parte;
      });
      res.on('end', () => resolve(saudavel(res.statusCode, corpo)));
      res.on('error', () => resolve(false));
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
