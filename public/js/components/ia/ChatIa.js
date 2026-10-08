import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { conversar } from '../../api/iaApi.js';

// Unica responsabilidade: conversa com o assistente (TASK-CHAT-3, contrato
// CTR-IA-02). Baloes do usuario a direita e da IA a esquerda, resposta em
// fluxo, botao Parar, fontes e avisos por resposta, erros por codigo.
// O texto do modelo entra SEMPRE como texto (textContent), nunca como HTML.
//
// Uso: <chat-ia></chat-ia> (geral) ou <chat-ia simbolo="WEGE3"
//       sugestoes="Por que o sinal está neutro?|O que mudou desde ontem?"></chat-ia>

const AVISO = 'Leitura automática com dados públicos, experimental. Não é recomendação de investimento.';
const MAX_CARACTERES = 1000;
const MAX_MENSAGENS_GUARDADAS = 40;

export const MENSAGENS_DE_ERRO = {
  INDISPONIVEL: 'Assistente indisponível agora.',
  LIMITE: 'Limite de mensagens atingido.',
  FORA_DO_TEMA: 'O assistente só responde sobre mercado financeiro e ações da B3.',
  ENTRADA_INVALIDA: 'Mensagem inválida (vazia ou longa demais).',
  RESPOSTA_INVALIDA: 'O assistente mandou uma resposta ilegível.',
};

/** "HH:MM" no horario de Brasilia; vazio se a data nao vier ou for invalida. */
export function horaDeBrasilia(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

/** Texto do erro para o usuario: mensagem fixa por codigo + horario de nova tentativa. */
export function textoDoErro(dados) {
  const base = MENSAGENS_DE_ERRO[dados && dados.codigo] || (dados && dados.mensagem) || MENSAGENS_DE_ERRO.INDISPONIVEL;
  const hora = horaDeBrasilia(dados && dados.tentar_apos);
  if (!hora) return base;
  return `${base.replace(/ agora\.$/, '.').replace(/\.$/, '')} até ${hora}.`;
}

function novoId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// sessionStorage pode faltar ou lancar (aba anonima, previa): o chat funciona sem ele.
function ler(chave) {
  try { return JSON.parse(globalThis.sessionStorage.getItem(chave) || 'null'); } catch { return null; }
}
function gravar(chave, valor) {
  try { globalThis.sessionStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
}

export class ChatIa extends BaseComponent {
  connectedCallback() {
    this._simbolo = (this.getAttribute('simbolo') || '').toUpperCase() || null;
    this._chave = `chat:${this._simbolo || 'geral'}`;
    const salvo = ler(this._chave);
    this._sessaoId = (salvo && salvo.sessaoId) || novoId();
    this._mensagens = (salvo && Array.isArray(salvo.mensagens)) ? salvo.mensagens : [];
    this._controle = null;
    this._modelo = (salvo && salvo.modelo) || '';
    super.connectedCallback();
  }

  disconnectedCallback() {
    if (this._controle) this._controle.abort();
  }

  sugestoes() {
    return (this.getAttribute('sugestoes') || '').split('|').map((s) => s.trim()).filter(Boolean);
  }

  template() {
    const rotulo = this._simbolo ? `Pergunte sobre ${this._simbolo}…` : 'Pergunte sobre mercado financeiro e ações da B3…';
    const chips = this.sugestoes()
      .map((s) => `<button type="button" class="btn btn-sm btn-outline-secondary" data-sugestao="${escaparHtml(s)}">${escaparHtml(s)}</button>`)
      .join('');
    return `
      <div class="chat-ia">
        <ol class="chat-ia-lista list-unstyled mb-2" aria-live="polite" aria-label="Conversa com o assistente"></ol>
        ${chips ? `<div class="chat-ia-sugestoes d-flex flex-wrap gap-1 mb-2">${chips}</div>` : ''}
        <form class="chat-ia-form d-flex gap-2 align-items-end">
          <textarea class="form-control form-control-sm" rows="2" maxlength="${MAX_CARACTERES}"
            aria-label="${escaparHtml(rotulo)}" placeholder="${escaparHtml(rotulo)}"></textarea>
          <button type="submit" class="btn btn-sm btn-primary" data-enviar>Enviar</button>
          <button type="button" class="btn btn-sm btn-outline-secondary d-none" data-parar>Parar</button>
        </form>
        <p class="chat-ia-rodape small text-muted mt-1 mb-0"></p>
      </div>`;
  }

  afterRender() {
    this._lista = this.querySelector('.chat-ia-lista');
    this._campo = this.querySelector('textarea');
    this._botaoEnviar = this.querySelector('[data-enviar]');
    this._botaoParar = this.querySelector('[data-parar]');
    this._rodape = this.querySelector('.chat-ia-rodape');
    this._mensagens.forEach((m) => this._lista.appendChild(this.balao(m)));
    this.atualizarRodape();

    this.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.enviar(this._campo.value);
    });
    this._campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        this.enviar(this._campo.value);
      }
    });
    this._botaoParar.addEventListener('click', () => this._controle && this._controle.abort());
    this.querySelectorAll('[data-sugestao]').forEach((b) =>
      b.addEventListener('click', () => this.enviar(b.dataset.sugestao)));
  }

  atualizarRodape() {
    this._rodape.textContent = this._modelo ? `${AVISO} Modelo: ${this._modelo}.` : AVISO;
  }

  /** Um balao; conteudo do modelo e do usuario sempre por textContent. */
  balao(m) {
    const li = document.createElement('li');
    li.className = `chat-ia-balao chat-ia-${m.autor}${m.erro ? ' chat-ia-erro' : ''}`;
    const texto = document.createElement('div');
    texto.className = 'chat-ia-texto';
    texto.textContent = m.texto || '';
    li.appendChild(texto);
    if (m.fontes && m.fontes.length) {
      const fontes = document.createElement('div');
      fontes.className = 'chat-ia-fontes d-flex flex-wrap gap-1 mt-1';
      m.fontes.forEach((f) => {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'badge border bg-body-tertiary text-body';
        etiqueta.textContent = f.rotulo || f.ref || f.tipo || 'fonte';
        if (f.ref) etiqueta.title = f.ref;
        fontes.appendChild(etiqueta);
      });
      li.appendChild(fontes);
    }
    (m.avisos || []).forEach((a) => {
      const nota = document.createElement('small');
      nota.className = 'chat-ia-aviso d-block text-warning-emphasis mt-1';
      nota.textContent = a;
      li.appendChild(nota);
    });
    return li;
  }

  rolarParaOFim() {
    this._lista.scrollTop = this._lista.scrollHeight;
  }

  salvar() {
    gravar(this._chave, {
      sessaoId: this._sessaoId,
      modelo: this._modelo,
      mensagens: this._mensagens.filter((m) => !m.digitando).slice(-MAX_MENSAGENS_GUARDADAS),
    });
  }

  ocupado(sim) {
    this._botaoEnviar.disabled = sim;
    this._campo.disabled = sim;
    this._botaoParar.classList.toggle('d-none', !sim);
  }

  async enviar(textoBruto) {
    const texto = String(textoBruto || '').trim();
    if (!texto || this._controle) return;
    if (texto.length > MAX_CARACTERES) {
      this.adicionar({ autor: 'ia', texto: MENSAGENS_DE_ERRO.ENTRADA_INVALIDA, erro: true });
      return;
    }
    this._campo.value = '';
    this.adicionar({ autor: 'usuario', texto });

    const resposta = { autor: 'ia', texto: '', fontes: [], avisos: [], digitando: true };
    const elemento = this.adicionar(resposta);
    elemento.classList.add('chat-ia-digitando');
    const atualizar = () => {
      const novo = this.balao(resposta);
      if (resposta.digitando) novo.classList.add('chat-ia-digitando');
      elemento.replaceChildren(...novo.childNodes);
      elemento.className = novo.className;
      this.rolarParaOFim();
    };

    this._controle = new AbortController();
    this.ocupado(true);
    try {
      await conversar({ sessaoId: this._sessaoId, mensagem: texto, simbolo: this._simbolo }, {
        signal: this._controle.signal,
        aoEvento: ({ evento, dados }) => {
          if (evento === 'inicio') {
            this._modelo = (dados && dados.modelo) || this._modelo;
            this.atualizarRodape();
          } else if (evento === 'token') {
            resposta.texto += (dados && dados.texto) || '';
          } else if (evento === 'fontes') {
            resposta.fontes = (dados && dados.fontes) || [];
          } else if (evento === 'aviso') {
            if (dados && dados.texto) resposta.avisos.push(dados.texto);
          } else if (evento === 'erro') {
            resposta.erro = true;
            resposta.texto = resposta.texto ? `${resposta.texto}\n\n${textoDoErro(dados)}` : textoDoErro(dados);
          }
          atualizar();
        },
      });
    } finally {
      const interrompida = this._controle.signal.aborted;
      this._controle = null;
      resposta.digitando = false;
      if (interrompida) resposta.avisos.push('Resposta interrompida.');
      if (!resposta.texto && !resposta.erro) {
        resposta.erro = true;
        resposta.texto = interrompida ? 'Resposta interrompida.' : MENSAGENS_DE_ERRO.INDISPONIVEL;
        resposta.avisos = [];
      }
      atualizar();
      this.ocupado(false);
      this.salvar();
      this._campo.focus();
    }
  }

  adicionar(m) {
    this._mensagens.push(m);
    const li = this.balao(m);
    this._lista.appendChild(li);
    this.rolarParaOFim();
    if (!m.digitando) this.salvar();
    return li;
  }
}

customElements.define('chat-ia', ChatIa);
