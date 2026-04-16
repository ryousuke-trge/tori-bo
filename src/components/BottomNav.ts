export function renderBottomNav(container: HTMLElement, currentHash: string) {

  const isHome = currentHash === '' || currentHash === '#/';
  const isStats = currentHash === '#/stats';
  const isAssets = currentHash === '#/assets';
  const isSettings = currentHash === '#/settings';

  const baseClass = "flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors";

  const activeClass = "text-yellow-400";

  const inactiveClass = "text-gray-400 hover:text-gray-600";

  container.innerHTML = `
    <a href="#/" class="${baseClass} ${isHome ? activeClass : inactiveClass}">
      <span class="text-xl mb-1">📅</span>
      <span class="text-[10px] sm:text-xs">ホーム</span>
    </a>
    <a href="#/assets" class="${baseClass} ${isAssets ? activeClass : inactiveClass}">
      <span class="text-xl mb-1">💰</span>
      <span class="text-[10px] sm:text-xs">資産</span>
    </a>
    <a href="#/stats" class="${baseClass} ${isStats ? activeClass : inactiveClass}">
      <span class="text-xl mb-1">📊</span>
      <span class="text-[10px] sm:text-xs">統計</span>
    </a>
    <a href="#/settings" class="${baseClass} ${isSettings ? activeClass : inactiveClass}">
      <span class="text-xl mb-1">⚙️</span>
      <span class="text-[10px] sm:text-xs">設定</span>
    </a>
  `;
}
