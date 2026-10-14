import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';

export function htmlSparkline(valores = [], rotulos = [], formato = 'numero') {
  const pontos = valores.map((v, i) => ({ valor: Number(v), rotulo: rotulos[i] })).filter((p) => Number.isFinite(p.valor));
  if (pontos.length < 2) return '<span class="small text-body-secondary">histórico indisponível</span>';
  const min = Math.min(...pontos.map((p) => p.valor)); const max = Math.max(...pontos.map((p) => p.valor));
  const pos = pontos.map((p, i) => `${(i * 100 / (pontos.length - 1)).toFixed(1)},${(25 - ((p.valor - min) / (max - min || 1)) * 22).toFixed(1)}`).join(' ');
  return `<svg class="f360-sparkline" viewBox="0 0 100 28" role="img" aria-label="Tendência de ${escaparHtml(formato)}"><polyline points="${pos}"/><title>${pontos.map((p) => `${escaparHtml(p.rotulo || '')}: ${p.valor}`).join(' · ')}</title></svg>`;
}

export class F360Sparkline extends BaseComponent {
  set valores(v) { this._valores = v; this.render(); }
  set rotulos(v) { this._rotulos = v; this.render(); }
  set formato(v) { this._formato = v; this.render(); }
  template() { return `<style>.f360-sparkline{width:100%;max-width:10rem;height:2rem;overflow:visible}.f360-sparkline polyline{fill:none;stroke:var(--bs-primary);stroke-width:2}</style>${htmlSparkline(this._valores || [], this._rotulos || [], this._formato || 'número')}`; }
}
if (!customElements.get('f360-sparkline')) customElements.define('f360-sparkline', F360Sparkline);
