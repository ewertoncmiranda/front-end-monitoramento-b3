// Unica responsabilidade: saber onde fica a API. Nao faz chamadas HTTP, nao sabe nada de UI.
//
// O proprio servidor (server.js) faz proxy reverso das rotas do backend
// (/ativos, /analises, /api) para o gestor-ativos-brutos - por isso o front
// sempre chama caminhos relativos ao seu proprio host, sem CORS e sem
// precisar saber o endereco real do backend.
export const apiConfig = {
  baseUrl: '',
};
