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

const pageContent = document.getElementById('page-content');

const bottomNav = document.getElementById('bottom-nav');

async function handleRoute() {

  if (!pageContent || !bottomNav) return;

  const { data: { session } } = await supabase.auth.getSession();

  const hash = window.location.hash;

  if (!session) {

    bottomNav.classList.add('hidden');

    renderLogin(pageContent);

    return;
  } else {

    bottomNav.classList.remove('hidden');
  }

  renderBottomNav(bottomNav, hash);

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

  supabase.auth.onAuthStateChange(() => {
    handleRoute();
  });

  await handleRoute();

  await initCategoriesIfEmpty();
}

init();
