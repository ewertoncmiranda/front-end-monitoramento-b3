// FONTES-PAI-5: logica pura da curva de juro real (NTN-B). Recebe o JSON de
// GET /indices-macro/curva-real: {dataBase, referencia, vencimentos, motivo}.
const ehNumero = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function taxaTexto(v) {
  return ehNumero(v) ? `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '—';
}

// 'AAAA-MM-DD' -> 'DD/MM/AAAA' sem passar por Date (sem fuso).
export function dataBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

// Pontos validos (vencimento + taxa de compra), do vencimento mais proximo ao mais distante.
export function pontosCurva(curva) {
  return (curva?.vencimentos || [])
    .filter((p) => p && /^\d{4}-\d{2}-\d{2}/.test(String(p.vencimento || '')) && ehNumero(p.taxaCompra))
    .map((p) => ({
      tipo: p.tipo || '',
      vencimento: String(p.vencimento).slice(0, 10),
      taxa: Number(p.taxaCompra),
      taxaVenda: ehNumero(p.taxaVenda) ? Number(p.taxaVenda) : null,
    }))
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

// Referencia utilizavel (taxa de compra numerica) ou null.
export function referenciaCurva(curva) {
  const r = curva?.referencia;
  return r && ehNumero(r.taxaCompra) && r.vencimento
    ? { tipo: r.tipo || '', vencimento: String(r.vencimento).slice(0, 10), taxa: Number(r.taxaCompra) }
    : null;
}

export function curvaDisponivel(curva) {
  return !!curva && !curva.motivo && (referenciaCurva(curva) !== null || pontosCurva(curva).length > 0);
}

// Curta (primeiro vencimento) vs longa (ultimo): longa < curta = invertida.
export function formaCurva(pontos) {
  if (!pontos || pontos.length < 2) return null;
  const curto = pontos[0];
  const longo = pontos[pontos.length - 1];
  const diferenca = longo.taxa - curto.taxa;
  const base = { curto, longo, diferenca };
  if (Math.abs(diferenca) < 0.005) return { ...base, forma: 'PLANA', rotulo: 'Curva plana', icone: '■', tom: 'secondary' };
  return diferenca < 0
    ? { ...base, forma: 'INVERTIDA', rotulo: 'Curva invertida', icone: '▼', tom: 'warning' }
    : { ...base, forma: 'NORMAL', rotulo: 'Curva normal', icone: '▲', tom: 'success' };
}

export function leituraForma(f) {
  if (!f) return '';
  const pp = `${Math.abs(f.diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} p.p.`;
  if (f.forma === 'PLANA') return `Vencimento curto (${taxaTexto(f.curto.taxa)}) e longo (${taxaTexto(f.longo.taxa)}) praticamente iguais.`;
  return `Vencimento longo (${f.longo.vencimento.slice(0, 4)}) paga ${taxaTexto(f.longo.taxa)}, ${pp} ${f.forma === 'INVERTIDA' ? 'abaixo' : 'acima'} do curto (${f.curto.vencimento.slice(0, 4)}, ${taxaTexto(f.curto.taxa)}).`;
}

// Linha para o cabecalho de decisao; '' quando nao ha referencia.
export function linhaReferencia(curva) {
  const r = curva && !curva.motivo ? referenciaCurva(curva) : null;
  return r ? `NTN-B de referência: ${taxaTexto(r.taxa)} (vencimento ${dataBr(r.vencimento)})` : '';
}

// Grafico simples: linha da taxa de compra por vencimento.
export function svgCurva(pontos) {
  if (!pontos || pontos.length < 2) return '';
  const W = 320, H = 120, ml = 40, mr = 8, mt = 8, mb = 22;
  const taxas = pontos.map((p) => p.taxa);
  let min = Math.min(...taxas), max = Math.max(...taxas);
  if (max - min < 0.2) { min -= 0.1; max += 0.1; }
  const x = (i) => ml + (i * (W - ml - mr)) / (pontos.length - 1);
  const y = (t) => mt + ((max - t) * (H - mt - mb)) / (max - min);
  const linha = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.taxa).toFixed(1)}`).join(' ');
  const ano = (p) => p.vencimento.slice(0, 4);
  const passo = Math.ceil(pontos.length / 5);
  const rotulos = pontos.map((p, i) => ((i % passo === 0 || i === pontos.length - 1)
    ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" fill="currentColor">${esc(ano(p))}</text>` : '')).join('');
  const marcas = pontos.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.taxa).toFixed(1)}" r="2.5" fill="currentColor"><title>${esc(dataBr(p.vencimento))}: ${esc(taxaTexto(p.taxa))}</title></circle>`).join('');
  const alt = `Curva de juro real das NTN-B: taxa de compra por vencimento, de ${taxaTexto(pontos[0].taxa)} em ${ano(pontos[0])} a ${taxaTexto(pontos[pontos.length - 1].taxa)} em ${ano(pontos[pontos.length - 1])}.`;
  return `<svg class="curva-real-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:26rem;height:auto;color:var(--bs-secondary-color)" role="img" aria-label="${esc(alt)}">
    <title>${esc(alt)}</title>
    <text x="${ml - 4}" y="${mt + 3}" text-anchor="end" font-size="9" fill="currentColor">${esc(taxaTexto(max))}</text>
    <text x="${ml - 4}" y="${H - mb}" text-anchor="end" font-size="9" fill="currentColor">${esc(taxaTexto(min))}</text>
    <line x1="${ml}" y1="${H - mb}" x2="${W - mr}" y2="${H - mb}" stroke="currentColor" stroke-opacity=".4"/>
    <polyline points="${linha}" fill="none" stroke="var(--bs-primary)" stroke-width="2" stroke-linejoin="round"/>
    ${marcas}${rotulos}</svg>`;
}
