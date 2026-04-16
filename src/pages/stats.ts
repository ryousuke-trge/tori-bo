import { api } from '../api';
import { formatDate } from '../utils/date';
import type { TransactionWithCategory } from '../types';
import { showMonthPicker } from '../components/MonthPicker';
import { showCategoryTransactionsModal } from '../components/CategoryTransactionsModal';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let searchQuery = '';
let selectedUser = 'all';

export async function renderStats(container: HTMLElement) {

  try {
    const profiles = api.getCachedProfiles();
    await updateStatsView(container, true, profiles);
  } catch (e) {
    container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-gray-400">読み込み中...</div></div>`;
  }

  try {
    const profiles = await api.getProfiles();
    await updateStatsView(container, false, profiles);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="p-4 text-red-500 text-center mt-10">データの取得に失敗しました。</div>`;
  }
}

async function updateStatsView(container: HTMLElement, useCache: boolean = false, profiles: any[] = []) {

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }
  const prevStartDate = new Date(prevYear, prevMonth, 1);
  const prevEndDate = new Date(prevYear, prevMonth + 1, 0);

  let currentTxs, prevTxs;
  if (useCache) {
    currentTxs = api.getCachedTransactions(formatDate(startDate), formatDate(endDate));
    prevTxs = api.getCachedTransactions(formatDate(prevStartDate), formatDate(prevEndDate));
    if (currentTxs.length === 0 && prevTxs.length === 0 && !localStorage.getItem('cache_transactions')) {
      throw new Error('No cache');
    }
  } else {

    [currentTxs, prevTxs] = await Promise.all([
      api.getTransactions(formatDate(startDate), formatDate(endDate)),
      api.getTransactions(formatDate(prevStartDate), formatDate(prevEndDate))
    ]);
  }

  const aggregate = (txs: TransactionWithCategory[]) => {
    let income = 0;
    let expense = 0;

    const catMap: Record<string, { name: string; icon: string; amount: number; count: number; type: 'income' | 'expense' }> = {};

    for (const tx of txs) {
      if (selectedUser !== 'all' && tx.author_name !== selectedUser) continue;

      if (!tx.categories) continue;
      const t = tx.categories.type;

      if (t === 'income') income += tx.amount;
      else expense += tx.amount;

      if (searchQuery && !tx.categories.name.includes(searchQuery)) continue;

      if (!catMap[tx.category_id]) {
        catMap[tx.category_id] = { name: tx.categories.name, icon: tx.categories.icon, amount: 0, count: 0, type: t };
      }

      catMap[tx.category_id].amount += tx.amount;
      catMap[tx.category_id].count += 1;
    }

    return { income, expense, catMap };
  };

  const curr = aggregate(currentTxs);
  const prev = aggregate(prevTxs);

  const diffIncome = curr.income - prev.income;
  const diffExpense = curr.expense - prev.expense;

  const formatDiff = (d: number) => d > 0 ? `+${d.toLocaleString()}` : d.toLocaleString();

  const items = Object.entries(curr.catMap).map(([id, val]) => ({ id, ...val })).sort((a, b) => b.amount - a.amount);

  const expenseItems = items.filter(i => i.type === 'expense');
  const incomeItems = items.filter(i => i.type === 'income');

  const html = `
    <div class="h-full flex flex-col pt-4 px-4 pb-[calc(4rem+env(safe-area-inset-bottom))]">

      <div class="flex items-center justify-between mb-4">
        <button id="st-prev-month" class="p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="relative flex items-center justify-center">
          <h1 id="month-header" class="text-xl font-bold text-gray-800 flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            ${currentYear}年 ${currentMonth + 1}月
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </h1>
        </div>
        <button id="st-next-month" class="p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div class="mb-4 flex gap-2">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input type="text" id="search-input" value="${searchQuery}" placeholder="カテゴリ名で検索..." class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm">
        </div>
        <select id="user-filter" class="w-32 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm appearance-none">
          <option value="all" ${selectedUser === 'all' ? 'selected' : ''}>全体</option>
          ${profiles.map(p => `<option value="${p.email}" ${selectedUser === p.email ? 'selected' : ''}>${p.display_name || p.email}</option>`).join('')}
        </select>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div class="flex-1">
          <div class="text-xs text-gray-400 mb-1">今月支出</div>
          <div class="text-lg font-bold text-red-500">¥${curr.expense.toLocaleString()}</div>
          <div class="text-[10px] ${diffExpense > 0 ? 'text-red-500' : 'text-green-500'} font-medium">先月比 ${formatDiff(diffExpense)}</div>
        </div>
        <div class="w-px h-10 bg-gray-200 mx-2"></div>
        <div class="flex-1">
          <div class="text-xs text-gray-400 mb-1">今月収入</div>
          <div class="text-lg font-bold text-green-600">¥${curr.income.toLocaleString()}</div>
          <div class="text-[10px] ${diffIncome < 0 ? 'text-red-500' : 'text-green-600'} font-medium">先月比 ${formatDiff(diffIncome)}</div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-1">
        <h2 class="text-sm font-bold text-gray-600 mb-3 ml-1">支出ランキング</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          ${expenseItems.length === 0 ? '<div class="p-4 text-center text-sm text-gray-400">データがありません</div>' : expenseItems.map((item, idx) => `
            <div class="stat-category-row flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer" data-id="${item.id}">
              <div class="flex items-center gap-3">
                <div class="w-6 text-center text-gray-400 text-sm font-bold">${idx + 1}</div>
                <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-xl">${item.icon}</div>
                <div>
                  <div class="text-sm font-medium text-gray-700">${item.name}</div>
                  <div class="text-xs text-gray-400">${item.count}件</div>
                </div>
              </div>
              <div class="text-sm font-semibold text-gray-800">¥${item.amount.toLocaleString()}</div>
            </div>
          `).join('')}
        </div>

        <h2 class="text-sm font-bold text-gray-600 mb-3 ml-1">収入ランキング</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          ${incomeItems.length === 0 ? '<div class="p-4 text-center text-sm text-gray-400">データがありません</div>' : incomeItems.map((item, idx) => `
            <div class="stat-category-row flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer" data-id="${item.id}">
              <div class="flex items-center gap-3">
                <div class="w-6 text-center text-gray-400 text-sm font-bold">${idx + 1}</div>
                <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-xl">${item.icon}</div>
                <div>
                  <div class="text-sm font-medium text-gray-700">${item.name}</div>
                  <div class="text-xs text-gray-400">${item.count}件</div>
                </div>
              </div>
              <div class="text-sm font-semibold text-gray-800">¥${item.amount.toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('month-header')?.addEventListener('click', () => {
    showMonthPicker(currentYear, currentMonth, (year, month) => {
      currentYear = year;
      currentMonth = month;
      updateStatsView(container, false, profiles);
    });
  });

  document.getElementById('st-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateStatsView(container, false, profiles);
  });

  document.getElementById('st-next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateStatsView(container, false, profiles);
  });

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    updateStatsView(container, false, profiles);

    setTimeout(() => {
      const el = document.getElementById('search-input') as HTMLInputElement;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 0);
  });

  const userFilter = document.getElementById('user-filter') as HTMLSelectElement;
  userFilter?.addEventListener('change', (e) => {
    selectedUser = (e.target as HTMLSelectElement).value;
    updateStatsView(container, false, profiles);
  });

  const rows = container.querySelectorAll('.stat-category-row');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const catId = row.getAttribute('data-id');
      if (!catId) return;

      const itemList = curr.catMap[catId];
      if (!itemList) return;

      const filteredTxs = currentTxs.filter(tx => {
        if (selectedUser !== 'all' && tx.author_name !== selectedUser) return false;
        if (searchQuery && (!tx.categories || !tx.categories.name.includes(searchQuery))) return false;
        return tx.category_id === catId;
      });

      filteredTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      showCategoryTransactionsModal(itemList.name, itemList.icon, filteredTxs);
    });
  });
}
