// Unica responsabilidade: tornar texto externo seguro para interpolar em
// innerHTML. Os componentes montam HTML por template string; qualquer texto
// que venha de fora (assunto de comunicado da CVM, por exemplo) passa por aqui
// antes, senao um "<" no assunto vira marcacao - ou script.
const ENTIDADES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escaparHtml(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto).replace(/[&<>"']/g, (caractere) => ENTIDADES[caractere]);
}
