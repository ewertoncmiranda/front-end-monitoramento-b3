// Ponto de entrada: registra os componentes de layout e inicia o router.
// Nao contem regra de negocio nenhuma.
import './components/AppHeader.js';
import './components/BottomNav.js';
import './pages/InicioPage.js';
import './pages/InicioPage.js';
import './pages/GestaoPage.js';
import './pages/AtivosPage.js';
import './pages/CandlesPage.js';
import './pages/ComunicadosPage.js';
import './pages/NoticiasPage.js';
import './pages/FormulasPage.js';
import './pages/ArquiteturaPage.js';
import './pages/DesignDeCodigoPage.js';
import './pages/AvaliacaoPage.js';
import './pages/PadroesPage.js';
import './pages/GlossarioPage.js';
import './pages/EstudosPage.js';
import './pages/IndicesMacroPage.js';
import './pages/OpcaoPage.js';
import './pages/AssistentePage.js';
import { iniciarRouter } from './router.js';
import { inicializarTema } from './utils/tema.js';

inicializarTema();
document.querySelector('#app-header-outlet').innerHTML = '<app-header></app-header>';
document.querySelector('#app-bottom-nav-outlet').innerHTML = '<bottom-nav></bottom-nav>';

iniciarRouter('#app-outlet');
