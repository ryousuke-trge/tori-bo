import { api } from '../api';
import { renderCalendar } from '../components/Calendar';
import { createTransactionModal } from '../components/TransactionModal';
import { renderDailyTransactionsList } from '../components/DailyTransactionsList';
import { formatDate } from '../utils/date';
import type { Category } from '../types';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
let categories: Category[] = [];
let selectedDateStr: string = formatDate(new Date());

export async function renderHome(container: HTMLElement) {
  // Render instantly using cache first
  categories = api.getCachedCategories();
  const hasCache = categories.length > 0;
  
  if (hasCache) {
    await updateHomeView(container, true);
  } else {
    container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-gray-400">読み込み中...</div></div>`;
  }

  // Fetch latest data in background and re-render
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
      container.innerHTML = `<div class="p-4 text-red-500 text-center mt-10">データの取得に失敗しました。設定（APIキー等）をご確認ください。</div>`;
    }
  }
}

async function updateHomeView(container: HTMLElement, useCache: boolean = false) {
  // Get first and last day of month in YYYY-MM-DD format
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const txs = useCache ? api.getCachedTransactions(startStr, endStr) : await api.getTransactions(startStr, endStr);

  // Daily aggregation and monthly summary
  const summaryByDate: Record<string, { income: number; expense: number }> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of txs) {
    const isIncome = tx.categories?.type === 'income';
    
    // Monthly aggregation
    if (isIncome) totalIncome += tx.amount;
    else totalExpense += tx.amount;

    // Daily aggregation
    if (!summaryByDate[tx.date]) summaryByDate[tx.date] = { income: 0, expense: 0 };
    if (isIncome) summaryByDate[tx.date].income += tx.amount;
    else summaryByDate[tx.date].expense += tx.amount;
  }

  const balance = totalIncome - totalExpense;
  const isPlus = balance >= 0;

  const html = `
    <div class="h-full flex flex-col pt-4 px-4 relative">
      <!-- Month navigation header -->
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

      <!-- Monthly summary -->
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

      <!-- Calendar area -->
      <div id="calendar-container"></div>
      
      <!-- Daily details list area -->
      <div id="daily-transactions-container" class="pb-[calc(7.5rem+env(safe-area-inset-bottom))]"></div>
      
      <!-- Floating Action Button (FAB) -->
      <div class="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] w-full max-w-md left-1/2 -translate-x-1/2 pointer-events-none flex justify-end px-4 sm:px-6 z-10">
        <button id="btn-add-tx" class="pointer-events-auto w-14 h-14 bg-yellow-400 text-white rounded-full shadow-lg hover:bg-yellow-500 hover:shadow-xl hover:-translate-y-1 transform transition-all flex items-center justify-center focus:outline-none shrink-0">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render calendar
  const calContainer = document.getElementById('calendar-container');
  if (calContainer) {
    renderCalendar(calContainer, currentYear, currentMonth, summaryByDate, selectedDateStr);

    // Calendar date click event
    calContainer.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-date]');
      if (target) {
        const dateStr = target.getAttribute('data-date');
        if (dateStr) {
          selectedDateStr = dateStr;
          updateHomeView(container); // Re-render with selected date
        }
      }
    });
  }

  // Render list
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
            asset_type: data.asset_type as "bank" | "cashless" | "cash" | undefined
          });
          await updateHomeView(container);
        }, {
          date: tx.date,
          amount: tx.amount,
          category_id: tx.category_id,
          memo: tx.memo,
          type: tx.categories?.type,
          isEdit: true,
          asset_type: tx.asset_type as "bank" | "cashless" | "cash" | undefined
        });
      }
    );
  }

  // Register event listeners
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
      // Save data
      await api.addTransaction({
        date: data.date,
        amount: data.amount,
        category_id: data.category_id,
        memo: data.memo,
        asset_type: data.asset_type as "bank" | "cashless" | "cash" | undefined
      });
      // Re-render after successful save
      await updateHomeView(container);
    }, { date: selectedDateStr });
  });
}

function showMonthPicker(currentYear: number, currentMonth: number, onSelect: (year: number, month: number) => void) {
  let selectedYear = currentYear;
  
  const modal = document.createElement('div');
  modal.className = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200";
  
  const renderContent = () => {
    let html = `
      <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-transform" onclick="event.stopPropagation()">
        <div class="p-5 flex items-center justify-between border-b border-gray-100">
          <button id="mp-prev-year" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div class="font-bold text-xl text-gray-800">${selectedYear}年</div>
          <button id="mp-next-year" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div class="p-6 grid grid-cols-3 gap-3">
    `;
    for(let m=0; m<12; m++) {
      const isCurrent = selectedYear === currentYear && m === currentMonth;
      const bgClass = isCurrent ? "bg-yellow-400 text-white font-bold shadow-md" : "bg-gray-50 hover:bg-yellow-50 text-gray-700 hover:text-yellow-600";
      html += `<button class="mp-month-btn py-3 rounded-xl text-center transition-all ${bgClass}" data-month="${m}">${m+1}月</button>`;
    }
    html += `
        </div>
        <div class="pb-5 text-center">
          <button id="mp-close" class="text-sm font-semibold text-gray-400 hover:text-gray-600 py-2 px-6 rounded-full hover:bg-gray-50 transition-colors">キャンセル</button>
        </div>
      </div>
    `;
    modal.innerHTML = html;
    
    modal.querySelector('#mp-prev-year')?.addEventListener('click', () => { selectedYear--; renderContent(); });
    modal.querySelector('#mp-next-year')?.addEventListener('click', () => { selectedYear++; renderContent(); });
    modal.querySelector('#mp-close')?.addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => document.body.removeChild(modal), 200);
    });
    
    modal.querySelectorAll('.mp-month-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = parseInt((e.target as HTMLElement).getAttribute('data-month')!, 10);
        modal.classList.add('opacity-0');
        setTimeout(() => {
          if (document.body.contains(modal)) document.body.removeChild(modal);
          onSelect(selectedYear, m);
        }, 200);
      });
    });
  };

  modal.addEventListener('click', () => {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      if (document.body.contains(modal)) document.body.removeChild(modal);
    }, 200);
  });
  
  renderContent();
  document.body.appendChild(modal);
}
