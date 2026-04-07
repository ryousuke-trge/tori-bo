import './style.css';
import { initCategoriesIfEmpty } from './seed';
import { renderHome } from './pages/home';
import { renderStats } from './pages/stats';
import { renderSettings } from './pages/settings';
import { renderBottomNav } from './components/BottomNav';

// DOM要素
const pageContent = document.getElementById('page-content');
const bottomNav = document.getElementById('bottom-nav');

function handleRoute() {
  if (!pageContent || !bottomNav) return;

  const hash = window.location.hash;

  // ナビゲーションの再描画
  renderBottomNav(bottomNav, hash);

  // コンテンツの再描画
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
  // ルーティングの初期化と初回のUI描画を先に行い、白い画面でフリーズするのを防ぐ
  window.addEventListener('hashchange', handleRoute);
  
  // 初期ロード時のルート解決 (これによりLoading表示が即座に出る)
  handleRoute();

  // その後バックグラウンドでDBの初期カテゴリ投入
  await initCategoriesIfEmpty();
}

init();
