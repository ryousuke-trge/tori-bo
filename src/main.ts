import './style.css';
import { initCategoriesIfEmpty } from './seed';
import { renderHome } from './pages/home';
import { renderStats } from './pages/stats';
import { renderAssets } from './pages/assets';
import { renderSettings } from './pages/settings';
import { renderLogin } from './pages/login';
import { renderBottomNav } from './components/BottomNav';
import { supabase } from './supabase';
import '@fontsource/yomogi';
import '@fontsource/zen-kaku-gothic-new';

// DOM elements
const pageContent = document.getElementById('page-content');
const bottomNav = document.getElementById('bottom-nav');

async function handleRoute() {
  if (!pageContent || !bottomNav) return;

  const { data: { session } } = await supabase.auth.getSession();
  const hash = window.location.hash;

  if (!session) {
    // If not logged in, force navigation to login page without modifying history if we're already there?
    // Actually just render login UI. Also hide bottom nav.
    bottomNav.classList.add('hidden');
    renderLogin(pageContent);
    return;
  } else {
    bottomNav.classList.remove('hidden');
  }

  // Re-render navigation
  renderBottomNav(bottomNav, hash);

  // Re-render content
  pageContent.innerHTML = '';
  switch (hash) {
    case '#/stats':
      renderStats(pageContent);
      break;
    case '#/assets':
      renderAssets(pageContent);
      break;
    case '#/settings':
      renderSettings(pageContent);
      break;
    case '#/login':
      // Authenticated but on login page -> redirect to home
      window.location.hash = '#/';
      break;
    case '':
    case '#/':
    default:
      renderHome(pageContent);
      break;
  }
}

async function init() {
  window.addEventListener('hashchange', handleRoute);
  
  // Listen to auth state changes to re-route automatically
  supabase.auth.onAuthStateChange(() => {
    handleRoute();
  });

  await handleRoute();

  // Then initialize categories in the database in the background
  await initCategoriesIfEmpty();
}

init();
