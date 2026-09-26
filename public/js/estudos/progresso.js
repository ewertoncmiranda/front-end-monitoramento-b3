// Unica responsabilidade: administrar progresso através de um armazenamento injetável.
export class ProgressoEstudos {
  constructor(armazenamento, idsValidos) {
    this.armazenamento = armazenamento;
    this.idsValidos = new Set(idsValidos);
    this.chave = 'b3.estudos.progresso.v1';
    this.persistente = true;
    this.concluidos = new Set();
    try {
      const dados = JSON.parse(armazenamento?.getItem(this.chave) || '[]');
      if (Array.isArray(dados)) {
        dados.filter(id => this.idsValidos.has(id)).forEach(id => this.concluidos.add(id));
      }
      if (!armazenamento) this.persistente = false;
    } catch { this.persistente = false; }
  }

  concluir(id, concluido) {
    if (!this.idsValidos.has(id)) return;
    if (concluido) this.concluidos.add(id);
    else this.concluidos.delete(id);
    try {
      if (!this.armazenamento) throw new Error('Armazenamento indisponível');
      this.armazenamento.setItem(this.chave, JSON.stringify([...this.concluidos]));
      this.persistente = true;
    } catch { this.persistente = false; }
  }

  resumo(ids) {
    const total = ids.length;
    const concluidos = ids.filter(id => this.concluidos.has(id)).length;
    return { total, concluidos, percentual: total ? Math.round(concluidos / total * 100) : 0 };
  }

  proximo(ids) { return ids.find(id => !this.concluidos.has(id)); }
}
