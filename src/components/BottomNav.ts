export function renderBottomNav(container: HTMLElement, currentHash: string) {
  const isHome = currentHash === '' || currentHash === '#/';
  const isStats = currentHash === '#/stats';
  const isSettings = currentHash === '#/settings';

  const baseClass = "flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors";
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-400 hover:text-gray-600";

  container.innerHTML = `
    <a href="#/" class="${baseClass} ${isHome ? activeClass : inactiveClass}">
      <img src="/home.png" alt="ホーム" class="w-11 h-11 object-contain transition-all ${isHome ? 'opacity-100 scale-105' : 'opacity-50 grayscale'}" />
    </a>
    <a href="#/stats" class="${baseClass} ${isStats ? activeClass : inactiveClass}">
      <span class="text-xl mb-1">📊</span>
      <span>統計</span>
    </a>
    <a href="#/settings" class="${baseClass} ${isSettings ? activeClass : inactiveClass}">
      <span class="text-xl mb-1">⚙️</span>
      <span>設定</span>
    </a>
  `;
}
