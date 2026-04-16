import { api } from '../api';
import { renderCalendar } from '../components/Calendar';
import { createTransactionModal } from '../components/TransactionModal';
import { renderDailyTransactionsList } from '../components/DailyTransactionsList';
import { formatDate } from '../utils/date';
import type { Category } from '../types';
import { showMonthPicker } from '../components/MonthPicker';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let categories: Category[] = [];
let selectedDateStr: string = formatDate(new Date());

export async function renderHome(container: HTMLElement) {

  categories = api.getCachedCategories();
  const hasCache = categories.length > 0;

  if (hasCache) {
    await updateHomeView(container, true);
  } else {
    container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-gray-400">読み込み中...</div></div>`;
  }

  try {
    const [cats] = await Promise.all([
      api.getCategories(),
      api.getProfiles()
    ]);
    categories = cats;

    await updateHomeView(container, false);
  } catch (error) {
    console.error(error);
    if (!hasCache) {
      container.innerHTML = `<div class="p-4 text-red-500 text-center mt-10">データの取得に失敗しました。設定をご確認ください。</div>`;
    }
  }
}

async function updateHomeView(container: HTMLElement, useCache: boolean = false) {

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const txs = useCache ? api.getCachedTransactions(startStr, endStr) : await api.getTransactions(startStr, endStr);

  const summaryByDate: Record<string, { income: number; expense: number }> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of txs) {
    const isIncome = tx.categories?.type === 'income';

    if (isIncome) totalIncome += tx.amount;
    else totalExpense += tx.amount;

    if (!summaryByDate[tx.date]) summaryByDate[tx.date] = { income: 0, expense: 0 };
    if (isIncome) summaryByDate[tx.date].income += tx.amount;
    else summaryByDate[tx.date].expense += tx.amount;
  }

  const balance = totalIncome - totalExpense;
  const isPlus = balance >= 0;

  const html = `
    <div class="h-full flex flex-col pt-4 px-4 relative">

      <div class="flex items-center justify-between mb-4">
        <button id="btn-prev-month" class="p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="relative flex items-center justify-center">
          <h1 id="month-header" class="text-xl font-bold text-gray-800 flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            ${currentYear}年 ${currentMonth + 1}月
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </h1>
        </div>
        <button id="btn-next-month" class="p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-2 flex justify-between items-center">
        <div class="flex-1 text-center">
          <div class="text-xs text-gray-400 font-medium mb-1">収入</div>
          <div class="text-green-600 font-semibold truncate">+${totalIncome.toLocaleString()}</div>
        </div>
        <div class="w-px h-8 bg-gray-200 mx-2"></div>
        <div class="flex-1 text-center">
          <div class="text-xs text-gray-400 font-medium mb-1">支出</div>
          <div class="text-red-500 font-semibold truncate">-${totalExpense.toLocaleString()}</div>
        </div>
        <div class="w-px h-8 bg-gray-200 mx-2"></div>
        <div class="flex-1 text-center">
          <div class="text-xs text-gray-400 font-medium mb-1">収支</div>
          <div class="font-bold truncate ${isPlus ? 'text-gray-800' : 'text-red-600'}">${isPlus ? '+' : ''}${balance.toLocaleString()}</div>
        </div>
      </div>

      <div id="calendar-container"></div>

      <div id="daily-transactions-container" class="pb-[calc(7.5rem+env(safe-area-inset-bottom))]"></div>

      <div class="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] w-full max-w-md left-1/2 -translate-x-1/2 pointer-events-none flex justify-end px-4 sm:px-6 z-10">
        <button id="btn-add-tx" class="pointer-events-auto w-14 h-14 bg-yellow-400 text-white rounded-full shadow-lg hover:bg-yellow-500 hover:shadow-xl hover:-translate-y-1 transform transition-all flex items-center justify-center focus:outline-none shrink-0">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const calContainer = document.getElementById('calendar-container');
  if (calContainer) {
    renderCalendar(calContainer, currentYear, currentMonth, summaryByDate, selectedDateStr);

    calContainer.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-date]');
      if (target) {
        const dateStr = target.getAttribute('data-date');
        if (dateStr) {
          selectedDateStr = dateStr;
          updateHomeView(container);
        }
      }
    });
  }

  const listContainer = document.getElementById('daily-transactions-container');
  if (listContainer) {
    const dailyTxs = txs.filter(tx => tx.date === selectedDateStr);

    renderDailyTransactionsList(
      listContainer,
      selectedDateStr,
      dailyTxs,

      async (id) => {
        await api.deleteTransaction(id);
        await updateHomeView(container);
      },

      (tx) => {
        createTransactionModal(categories, async (data) => {
          await api.updateTransaction(tx.id, {
            date: data.date,
            amount: data.amount,
            category_id: data.category_id,
            memo: data.memo,
            asset_type: data.asset_type as "bank" | "cashless" | "cash" | undefined,
            author_name: data.author_name
          });
          await updateHomeView(container);
        }, {
          date: tx.date,
          amount: tx.amount,
          category_id: tx.category_id,
          memo: tx.memo,
          type: tx.categories?.type,
          isEdit: true,
          asset_type: tx.asset_type as "bank" | "cashless" | "cash" | undefined,
          author_name: tx.author_name
        });
      }
    );
  }

  document.getElementById('month-header')?.addEventListener('click', () => {
    showMonthPicker(currentYear, currentMonth, (year, month) => {
      currentYear = year;
      currentMonth = month;
      updateHomeView(container);
    });
  });

  document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateHomeView(container);
  });

  document.getElementById('btn-next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateHomeView(container);
  });

  document.getElementById('btn-add-tx')?.addEventListener('click', () => {
    createTransactionModal(categories, async (data) => {
      await api.addTransaction({
        date: data.date,
        amount: data.amount,
        category_id: data.category_id,
        memo: data.memo,
        asset_type: data.asset_type as "bank" | "cashless" | "cash" | undefined,
        author_name: data.author_name || undefined
      });
      await updateHomeView(container);
    }, { date: selectedDateStr });
  });
}
