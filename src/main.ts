import './style.css';
import { initCategoriesIfEmpty } from './seed';
import { renderHome } from './pages/home';
import { renderStats } from './pages/stats';
import { renderSettings } from './pages/settings';
import { renderBottomNav } from './components/BottomNav';
import '@fontsource/yomogi';
import '@fontsource/zen-kaku-gothic-new';

// DOM elements
const pageContent = document.getElementById('page-content');
const bottomNav = document.getElementById('bottom-nav');

function handleRoute() {
  if (!pageContent || !bottomNav) return;

  const hash = window.location.hash;

  // Re-render navigation
  renderBottomNav(bottomNav, hash);

  // Re-render content
  pageContent.innerHTML = '';
  switch (hash) {
    case '#/stats':
      renderStats(pageContent);
      break;
    case '#/settings':
      renderSettings(pageContent);
      break;
    case '':
    case '#/':
    default:
      renderHome(pageContent);
      break;
  }
}

async function init() {
  // Initialize routing and render initial UI first to prevent white screen freeze
  window.addEventListener('hashchange', handleRoute);
  
  // Route resolution on initial load (This shows the loading indicator immediately)
  handleRoute();

  // Then initialize categories in the database in the background
  await initCategoriesIfEmpty();
}

init();
