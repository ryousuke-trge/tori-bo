import type { Category } from '../types';
import { formatDate } from '../utils/date';

export function createTransactionModal(
  categories: Category[],
  onSubmit: (data: { date: string; amount: number; category_id: string; memo: string; asset_type?: string }) => Promise<void>,
  initialOptions?: {
    date?: string;
    amount?: number;
    category_id?: string;
    memo?: string;
    type?: 'income' | 'expense';
    isEdit?: boolean;
    asset_type?: 'bank' | 'cashless' | 'cash';
  }
) {
  // Remove existing modal if any
  const existingModal = document.getElementById('transaction-modal');
  if (existingModal) existingModal.remove();

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const modalHtml = `
    <div id="transaction-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm opacity-0 transition-opacity duration-300 p-4">
      <div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl transform scale-95 opacity-0 transition-all duration-300">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-800">${initialOptions?.isEdit ? '収支を編集' : '収支を追加'}</h2>
          <button id="modal-close-btn" class="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form id="transaction-form" class="flex flex-col gap-4">
          <!-- Type selection -->
          <div class="flex bg-gray-100 rounded-lg p-1">
            <label class="flex-1 text-center cursor-pointer">
              <input type="radio" name="type" value="expense" class="peer sr-only" ${initialOptions?.type === 'income' ? '' : 'checked'} />
              <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-red-500 transition-all">支出</div>
            </label>
            <label class="flex-1 text-center cursor-pointer">
              <input type="radio" name="type" value="income" class="peer sr-only" ${initialOptions?.type === 'income' ? 'checked' : ''} />
              <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-green-600 transition-all">収入</div>
            </label>
          </div>

          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">日付</label>
            <input type="date" id="tx-date" name="date" required value="${initialOptions?.date || formatDate(new Date())}" class="w-full max-w-full min-w-0 appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-12 box-border" />
          </div>

          <!-- Asset -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">対象の資産</label>
            <div class="flex bg-gray-100 rounded-lg p-1 gap-1">
              <label class="flex-1 text-center cursor-pointer">
                <input type="radio" name="asset_type" value="cash" class="peer sr-only" ${initialOptions?.asset_type === 'cash' || !initialOptions?.asset_type ? 'checked' : ''} />
                <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-blue-600 transition-all">現金</div>
              </label>
              <label class="flex-1 text-center cursor-pointer">
                <input type="radio" name="asset_type" value="bank" class="peer sr-only" ${initialOptions?.asset_type === 'bank' ? 'checked' : ''} />
                <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-blue-600 transition-all">口座</div>
              </label>
              <label class="flex-1 text-center cursor-pointer">
                <input type="radio" name="asset_type" value="cashless" class="peer sr-only" ${initialOptions?.asset_type === 'cashless' ? 'checked' : ''} />
                <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-blue-600 transition-all">電子/カード</div>
              </label>
            </div>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">金額 (円)</label>
            <input type="number" id="tx-amount" name="amount" required min="1" placeholder="0" value="${initialOptions?.amount || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-12" />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">カテゴリ</label>
            <select id="tx-category" name="category_id" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none h-12 bg-no-repeat" style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-position: right 0.7rem top 50%; background-size: 0.65rem auto;">
              <optgroup label="支出" id="optgroup-expense" style="${initialOptions?.type === 'income' ? 'display: none;' : ''}">
                ${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
              </optgroup>
              <optgroup label="収入" id="optgroup-income" style="${initialOptions?.type === 'income' ? '' : 'display: none;'}">
                ${incomeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
              </optgroup>
            </select>
          </div>

          <!-- Memo -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">メモ</label>
            <input type="text" id="tx-memo" name="memo" placeholder="任意" value="${initialOptions?.memo || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-12" />
          </div>

          <button type="submit" class="mt-2 w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg">
            保存する
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('transaction-modal')!;
  const inner = modal.firstElementChild!;
  const form = document.getElementById('transaction-form') as HTMLFormElement;
  const closeBtn = document.getElementById('modal-close-btn')!;
  
  const typeRadios = form.querySelectorAll<HTMLInputElement>('input[name="type"]');
  const catSelect = document.getElementById('tx-category') as HTMLSelectElement;
  const optExp = document.getElementById('optgroup-expense')!;
  const optInc = document.getElementById('optgroup-income')!;

  // Set initial category
  if (initialOptions?.category_id) {
    catSelect.value = initialOptions.category_id;
  } else {
    // Fallback to default
    if (initialOptions?.type === 'income' && incomeCategories.length > 0) {
      catSelect.value = incomeCategories[0].id;
    } else if (expenseCategories.length > 0) {
      catSelect.value = expenseCategories[0].id;
    }
  }

  // Show animation
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
    inner.classList.remove('scale-95', 'opacity-0');
  });

  const closeModal = () => {
    modal.classList.add('opacity-0');
    inner.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.remove(), 300); // Remove after animation ends
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Filter categories by type
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (val === 'income') {
        optExp.style.display = 'none';
        optInc.style.display = '';
        // Select the first income category
        if (incomeCategories.length > 0) catSelect.value = incomeCategories[0].id;
      } else {
        optExp.style.display = '';
        optInc.style.display = 'none';
        if (expenseCategories.length > 0) catSelect.value = expenseCategories[0].id;
      }
    });
  });

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const date = data.get('date') as string;
    const amountStr = data.get('amount') as string;
    const category_id = data.get('category_id') as string;
    const memo = (data.get('memo') as string) || '';
    const asset_type = data.get('asset_type') as string;

    const amount = Number(amountStr);
    if (!date || !amount || !category_id) return;

    try {
      // Set submit button to loading state, etc.
      await onSubmit({ date, amount, category_id, memo, asset_type });
      closeModal();
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
  });
}
