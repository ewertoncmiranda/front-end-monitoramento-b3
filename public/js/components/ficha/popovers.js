// Unica responsabilidade: ligar os popovers do Bootstrap (bundle global do
// index.html) nos elementos [data-bs-toggle="popover"] de um trecho da tela.
// Sem o bundle (teste isolado), os botoes continuam com o texto no title.
export function ligarPopovers(raiz) {
  raiz.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
    if (!window.bootstrap?.Popover) {
      el.title = el.dataset.bsContent || '';
      return;
    }
    window.bootstrap.Popover.getOrCreateInstance(el, { container: 'body' });
  });
}
