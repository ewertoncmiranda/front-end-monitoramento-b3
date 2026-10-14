import { buscarChave } from '../../api/ficha360Api.js';

// Unica responsabilidade: dar a cada secao da ficha os dados do ativo pelo
// contrato C2 (SPEC, Plano F360). Cada chave e buscada uma vez por ficha;
// falha de rede ou 404 vira null, nunca rejeicao - a secao decide o que
// mostrar sem dado. As secoes dependem desta interface, nao da API (DIP).
export class FichaContexto {
  constructor(simbolo, buscar = buscarChave) {
    this.simbolo = String(simbolo || '').trim().toUpperCase();
    this._buscar = buscar;
    this._cache = new Map();
  }

  obter(chave) {
    if (!this._cache.has(chave)) {
      const promessa = Promise.resolve()
        .then(() => this._buscar(chave, this.simbolo))
        .then((dados) => dados ?? null)
        .catch(() => null);
      this._cache.set(chave, promessa);
    }
    return this._cache.get(chave);
  }
}
