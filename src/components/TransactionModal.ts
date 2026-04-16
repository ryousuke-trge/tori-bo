import type { Category } from '../types';
import { formatDate } from '../utils/date';
import { showMonthPicker } from './MonthPicker';
import { api } from '../api';

export function createTransactionModal(
  categories: Category[],
  onSubmit: (data: { date: string; amount: number; category_id: string; memo: string; asset_type?: string; author_name?: string }) => Promise<void>,
  initialOptions?: {
    date?: string;
    amount?: number;
    category_id?: string;
    memo?: string;
    type?: 'income' | 'expense';
    isEdit?: boolean;
    asset_type?: 'bank' | 'cashless' | 'cash';
    author_name?: string;
  }
) {

  const existingModal = document.getElementById('transaction-modal');
  if (existingModal) existingModal.remove();

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const modalHtml = `
    <div id="transaction-modal" class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 backdrop-blur-sm opacity-0 transition-opacity duration-300">
      <div id="transaction-modal-backdrop" class="flex min-h-[100dvh] items-center justify-center p-4">
        <div id="transaction-modal-inner" class="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl transform scale-95 opacity-0 transition-all duration-300 relative">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-800">${initialOptions?.isEdit ? '収支を編集' : '収支を追加'}</h2>
          <button id="modal-close-btn" class="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="transaction-form" class="flex flex-col gap-4">

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

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">日付</label>
            <div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-2 h-12">
              <button type="button" id="tx-prev-day" class="p-1 text-gray-500 hover:bg-gray-200 rounded-full transition-colors focus:outline-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div class="flex-1 flex items-center justify-center gap-2">
                <div id="tx-ym-header" class="text-base font-bold text-gray-800 flex items-center gap-1 cursor-pointer hover:opacity-80">
                  <span id="tx-ym-label"></span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>

                <div class="relative w-16 h-full flex items-center justify-center">
                  <select id="tx-day-select" class="w-full h-full bg-transparent appearance-none pl-1 pr-6 text-base font-bold text-gray-800 focus:outline-none cursor-pointer text-right">

                  </select>
                  <div class="absolute right-1 pointer-events-none text-gray-800 font-bold">日</div>
                </div>
              </div>

              <button type="button" id="tx-next-day" class="p-1 text-gray-500 hover:bg-gray-200 rounded-full transition-colors focus:outline-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <input type="hidden" id="tx-date" name="date" value="${initialOptions?.date || formatDate(new Date())}" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">金額 (円)</label>
            <input type="number" id="tx-amount" name="amount" required min="1" placeholder="0" value="${initialOptions?.amount || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-12" />
          </div>

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

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">ユーザー</label>
            <select id="tx-author" name="author_name" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none h-12 bg-no-repeat" style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-position: right 0.7rem top 50%; background-size: 0.65rem auto;">
              <option value="">読込中...</option>
            </select>
          </div>

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
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('transaction-modal')!;
  const inner = document.getElementById('transaction-modal-inner')!;
  const form = document.getElementById('transaction-form') as HTMLFormElement;
  const closeBtn = document.getElementById('modal-close-btn')!;

  const typeRadios = form.querySelectorAll<HTMLInputElement>('input[name="type"]');
  const catSelect = document.getElementById('tx-category') as HTMLSelectElement;
  const optExp = document.getElementById('optgroup-expense')!;
  const optInc = document.getElementById('optgroup-income')!;

  const txDateInput = document.getElementById('tx-date') as HTMLInputElement;
  const txYmLabel = document.getElementById('tx-ym-label')!;
  const txDaySelect = document.getElementById('tx-day-select') as HTMLSelectElement;
  const txPrevDay = document.getElementById('tx-prev-day')!;
  const txNextDay = document.getElementById('tx-next-day')!;
  const txYmHeader = document.getElementById('tx-ym-header')!;

  let selectedDateObj = new Date(txDateInput.value);

  const updateDateUI = () => {
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    const day = selectedDateObj.getDate();

    txYmLabel.textContent = `${year}年 ${month + 1}月`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    txDaySelect.innerHTML = '';
    for (let i = 1; i <= daysInMonth; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = i.toString();
        if (i === day) option.selected = true;
        txDaySelect.appendChild(option);
    }

    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    txDateInput.value = `${year}-${mStr}-${dStr}`;
  };

  updateDateUI();

  const changeDay = (delta: number) => {
    selectedDateObj.setDate(selectedDateObj.getDate() + delta);
    updateDateUI();
  };

  txPrevDay.addEventListener('click', (e) => { e.preventDefault(); changeDay(-1); });
  txNextDay.addEventListener('click', (e) => { e.preventDefault(); changeDay(1); });

  txYmHeader.addEventListener('click', () => {
    showMonthPicker(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), (year, month) => {
      let day = selectedDateObj.getDate();

      const daysInNewMonth = new Date(year, month + 1, 0).getDate();
      if (day > daysInNewMonth) day = daysInNewMonth;

      selectedDateObj = new Date(year, month, day);
      updateDateUI();
    });
  });

  txDaySelect.addEventListener('change', (e) => {
    const newDay = parseInt((e.target as HTMLSelectElement).value, 10);
    selectedDateObj.setDate(newDay);
    updateDateUI();
  });

  if (initialOptions?.category_id) {

    catSelect.value = initialOptions.category_id;
  } else {

    if (initialOptions?.type === 'income' && incomeCategories.length > 0) {
      catSelect.value = incomeCategories[0].id;
    } else if (expenseCategories.length > 0) {
      catSelect.value = expenseCategories[0].id;
    }
  }

  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
    inner.classList.remove('scale-95', 'opacity-0');
  });

  const closeModal = () => {
    modal.classList.add('opacity-0');
    inner.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === modal || target.id === 'transaction-modal-backdrop') closeModal();
  });

  const txAmount = document.getElementById('tx-amount');
  const txMemo = document.getElementById('tx-memo');
  const submitBtn = form.querySelector('button[type="submit"]');

  let isFirstAmountFocus = true;

  const scrollToCenter = (e: Event) => {
    setTimeout(() => {
      (e.target as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  txAmount?.addEventListener('focus', (e) => {
    setTimeout(() => {
      if (isFirstAmountFocus && submitBtn) {

        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
        isFirstAmountFocus = false;
      } else {

        (e.target as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  });

  txMemo?.addEventListener('focus', scrollToCenter);

  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (val === 'income') {

        optExp.style.display = 'none';
        optInc.style.display = '';
        if (incomeCategories.length > 0) catSelect.value = incomeCategories[0].id;
      } else {

        optExp.style.display = '';
        optInc.style.display = 'none';
        if (expenseCategories.length > 0) catSelect.value = expenseCategories[0].id;
      }
    });
  });

  const txAuthor = document.getElementById('tx-author') as HTMLSelectElement;
  api.getCurrentUserEmail().then(email => {
    let html = '';
    const profiles = api.getCachedProfiles();

    const isDefaultSelected = !initialOptions?.author_name || initialOptions?.author_name === email;
    const myProfile = profiles.find(p => p.email === email);
    const myName = myProfile ? myProfile.display_name : (email || '自分');
    html += `<option value="${email || ''}" ${isDefaultSelected ? 'selected' : ''}>${myName} (自分)</option>`;

    profiles.forEach(p => {
      if (p.email === email) return;

      const isSelected = initialOptions?.author_name === p.email;
      html += `<option value="${p.email}" ${isSelected ? 'selected' : ''}>${p.display_name}</option>`;
    });

    if (txAuthor) {
      txAuthor.innerHTML = html;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const date = data.get('date') as string;
    const amountStr = data.get('amount') as string;
    const category_id = data.get('category_id') as string;
    const memo = (data.get('memo') as string) || '';
    const asset_type = data.get('asset_type') as string;
    const author_name = data.get('author_name') as string;

    const amount = Number(amountStr);
    if (!date || !amount || !category_id) return;

    try {
      await onSubmit({ date, amount, category_id, memo, asset_type, author_name });
      closeModal();
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
  });
}
