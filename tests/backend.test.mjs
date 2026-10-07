// ISS-10: healthcheck do backend - so 2xx (e status UP) conta como saudavel; HTTP e HTTPS.
import assert from 'node:assert/strict';
import http from 'node:http';
import { saudavel, verificarSaude } from '../proxy/backendConfig.js';

assert.equal(saudavel(200, '{"status":"UP"}'), true);
assert.equal(saudavel(200, '{"status":"DOWN"}'), false);
assert.equal(saudavel(200, 'ok'), true);
assert.equal(saudavel(404, ''), false, '404 nao e saudavel');
assert.equal(saudavel(401, ''), false);
assert.equal(saudavel(503, '{"status":"DOWN"}'), false);

function servidor(status, corpo) {
  return new Promise((ok) => {
    const s = http.createServer((_, res) => {
      res.statusCode = status;
      res.end(corpo);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

for (const [status, corpo, esperado] of [[200, '{"status":"UP"}', true], [404, 'nada', false], [503, '{"status":"DOWN"}', false]]) {
  const s = await servidor(status, corpo);
  assert.equal(await verificarSaude(`http://127.0.0.1:${s.address().port}`), esperado, `status ${status}`);
  s.close();
}
assert.equal(await verificarSaude('http://127.0.0.1:1'), false, 'porta fechada');
assert.equal(await verificarSaude('isto nao e url'), false);
console.log('backend.test.mjs ok');
