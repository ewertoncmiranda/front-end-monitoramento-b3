// Ponto de entrada: registra os componentes de layout e inicia o router.
// Nao contem regra de negocio nenhuma.
import './components/AppHeader.js';
import './components/BottomNav.js';
import './pages/ConsultaPage.js';
import './pages/CadastroPage.js';
import { iniciarRouter } from './router.js';

document.querySelector('#app-header-outlet').innerHTML = '<app-header></app-header>';
document.querySelector('#app-bottom-nav-outlet').innerHTML = '<bottom-nav></bottom-nav>';

iniciarRouter('#app-outlet');
