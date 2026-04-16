import type { TransactionWithCategory } from '../types';
import { api } from '../api';

export function showCategoryTransactionsModal(
  categoryName: string,
  categoryIcon: string,
  transactions: TransactionWithCategory[],
  onClose?: () => void
) {

  const existingModal = document.getElementById('category-tx-modal');
  if (existingModal) existingModal.remove();

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const profiles = api.getCachedProfiles();

  const isIncome = transactions.length > 0 && transactions[0].categories?.type === 'income';

  const modalHtml = `
    <div id="category-tx-modal" class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 backdrop-blur-sm opacity-0 transition-opacity duration-300">
      <div id="category-tx-backdrop" class="flex min-h-[100dvh] items-end sm:items-center justify-center p-0 sm:p-4 pb-0">
        <div id="category-tx-inner" class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-0 shadow-2xl transform translate-y-full sm:translate-y-0 sm:scale-95 opacity-0 transition-all duration-300 flex flex-col max-h-[90vh]">

          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sm:rounded-t-2xl rounded-t-2xl z-10 shrink-0">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-xl shadow-sm border border-gray-200 shrink-0">${categoryIcon}</div>
              <div class="truncate">
                <h2 class="text-lg font-bold text-gray-800 truncate">${categoryName}</h2>
                <div class="text-xs text-gray-500 font-medium">${transactions.length}件の記録</div>
              </div>
            </div>

            <button id="category-modal-close-btn" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 focus:outline-none bg-gray-50">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0 flex justify-between items-center">
            <span class="text-xs font-bold text-gray-400 tracking-wider">合計金額</span>
            <span class="text-lg font-extrabold ${isIncome ? 'text-green-600' : 'text-red-500'}">¥${totalAmount.toLocaleString()}</span>
          </div>

          <div class="overflow-y-auto overflow-x-hidden flex-1 p-4 pb-8 sm:pb-4 space-y-2 relative">
            ${transactions.length === 0 ? '<div class="text-center py-8 text-sm text-gray-400">記録がありません</div>' :
              transactions.map(tx => {
                const dateObj = new Date(tx.date);
                const mmdd = `${dateObj.getMonth()+1}/${dateObj.getDate()}`;

                const authorProfile = profiles.find(p => p.email === tx.author_name);
                const authorName = authorProfile?.display_name || tx.author_name;

                return `
                  <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <div class="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded w-11 text-center shrink-0">${mmdd}</div>
                      <div class="truncate">
                        ${tx.memo ? `<div class="text-sm font-medium text-gray-700 truncate">${tx.memo}</div>` : '<div class="text-[13px] font-medium text-gray-400 italic">メモなし</div>'}
                        ${authorName ? `<div class="text-[10px] text-gray-400 truncate mt-0.5"><span class="inline-block bg-gray-200 text-gray-500 px-1 py-0.5 rounded mr-1">登録者</span>${authorName}</div>` : ''}
                      </div>
                    </div>
                    <div class="text-sm font-bold text-gray-800 ml-2 shrink-0">
                      ¥${tx.amount.toLocaleString()}
                    </div>
                  </div>
                `;
              }).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('category-tx-modal')!;
  const inner = document.getElementById('category-tx-inner')!;
  const closeBtn = document.getElementById('category-modal-close-btn')!;
  const backdrop = document.getElementById('category-tx-backdrop')!;

  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
    inner.classList.remove('opacity-0');

    if (window.innerWidth < 640) {
      inner.classList.remove('translate-y-full');
    } else {
      inner.classList.remove('scale-95');
    }
  });

  const closeModal = () => {
    modal.classList.add('opacity-0');
    inner.classList.add('opacity-0');
    if (window.innerWidth < 640) {
      inner.classList.add('translate-y-full');
    } else {
      inner.classList.add('scale-95');
    }
    setTimeout(() => {
      modal.remove();
      if (onClose) onClose();
    }, 300);
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === modal || target === backdrop) closeModal();
  });
}
