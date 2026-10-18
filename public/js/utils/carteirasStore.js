// Unica responsabilidade: ler e apagar a copia antiga das carteiras guardada
// no navegador (b3-carteiras). As carteiras vivem no gestor (CARTDB-GES-1);
// isto so serve de origem para a importacao (CARTDB-PAI-1).

const CHAVE = 'b3-carteiras';

/** Carteiras ainda guardadas no navegador; [] se nao houver ou se o JSON estiver corrompido. */
export function listarCarteiras() {
  try {
    const raw = localStorage.getItem(CHAVE);
    const dados = raw ? JSON.parse(raw) : null;
    return Array.isArray(dados?.carteiras) ? dados.carteiras : [];
  } catch {
    return [];
  }
}

/** Apaga a copia local inteira - so depois que o gestor confirmar a importacao. */
export function limparCarteirasLocais() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // sem armazenamento: nada a apagar
  }
}
