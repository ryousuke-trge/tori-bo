import type { TransactionWithCategory } from '../types';

export function renderDailyTransactionsList(
  container: HTMLElement,
  dateStr: string,
  transactions: TransactionWithCategory[],
  onDelete: (id: string) => Promise<void>,
  onEdit?: (tx: TransactionWithCategory) => void
) {
  const [y, m, d] = dateStr.split('-');
  const displayDate = `${y}年${Number(m)}月${Number(d)}日`;

  const totalIncome = transactions.filter(t => t.categories?.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.categories?.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const isPlus = balance >= 0;

  let html = `
    <div class="mt-4 mb-24 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-gray-100 pb-2 gap-2">
        <h2 class="text-lg font-bold text-gray-800">${displayDate}</h2>
        <div class="text-sm font-medium flex flex-wrap gap-x-3 gap-y-1">
          <span class="text-yellow-500">収入: +${totalIncome.toLocaleString()}</span>
          <span class="text-red-500">支出: -${totalExpense.toLocaleString()}</span>
          <span class="${isPlus ? 'text-gray-800' : 'text-red-500'} font-bold">収支: ${isPlus ? '+' : ''}${balance.toLocaleString()}</span>
        </div>
      </div>
  `;

  if (transactions.length === 0) {
    html += `
      <div class="text-center py-8 text-gray-400">
        <svg class="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        <p class="text-sm">この日の取引はありません</p>
      </div>
    `;
  } else {
    html += `<ul class="space-y-3">`;
    for (const tx of transactions) {
      const isIncome = tx.categories?.type === 'income';
      html += `
        <li class="dtl-item flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" data-id="${tx.id}">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white shadow-sm border border-gray-100">
              ${tx.categories?.icon || '🏷️'}
            </div>
            <div class="truncate">
              <div class="font-bold text-gray-800 text-sm">${tx.categories?.name || '不明なカテゴリ'}</div>
              ${tx.memo ? `<div class="text-xs text-gray-500 truncate">${tx.memo}</div>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-3 ml-2 flex-shrink-0">
            <div class="font-bold text-right ${isIncome ? 'text-yellow-500' : 'text-red-500'}">
              ${isIncome ? '+' : '-'}${tx.amount.toLocaleString()}
            </div>
            <button class="dtl-delete-btn text-gray-400 hover:text-red-500 p-1" data-id="${tx.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </li>
      `;
    }
    html += `</ul>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  const deleteBtns = container.querySelectorAll('.dtl-delete-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id && confirm('この取引を削除してもよろしいですか？')) {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg class="w-5 h-5 animate-spin text-red-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>`;
        btn.setAttribute('disabled', 'true');
        try {
          await onDelete(id);
        } catch (error) {
          console.error(error);
          alert('削除に失敗しました');
          btn.innerHTML = originalHtml;
          btn.removeAttribute('disabled');
        }
      }
    });
  });

  const items = container.querySelectorAll('.dtl-item');
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      // Do not trigger when delete button is clicked
      if ((e.target as HTMLElement).closest('.dtl-delete-btn')) return;
      
      const id = item.getAttribute('data-id');
      const tx = transactions.find(t => t.id === id);
      if (tx && onEdit) {
        onEdit(tx);
      }
    });
  });
}
