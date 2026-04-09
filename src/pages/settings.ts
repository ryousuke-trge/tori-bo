import { api } from '../api';
import Sortable from 'sortablejs';

const COMMON_EMOJIS = ['💰', '🍔', '🚃', '🏥', '🏠', '💡', '📱', '🎮', '👕', '✂️', '🎁', '🎓', '🏛️', '🍻', '💳', '📦'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: '毎日',
  weekdays: '平日',
  weekends: '週末',
  weekly: '毎週',
  biweekly: '2週間ごと',
  every_4_weeks: '4週間ごと',
  monthly: '毎月',
  every_2_months: '2ヶ月ごと',
  quarterly: '3ヶ月ごと',
  every_4_months: '4ヶ月ごと',
  every_5_months: '5ヶ月ごと',
  half_yearly: '半年ごと',
  yearly: '毎年ごと'
};

// Initialize global emoji picker
let pickerEl: HTMLElement | null = null;
let activeEmojiInput: HTMLInputElement | null = null;

function initEmojiPicker() {
  if (!document.getElementById('global-emoji-picker')) {
    pickerEl = document.createElement('div');
    pickerEl.id = 'global-emoji-picker';
    pickerEl.className = 'fixed bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[60] flex flex-wrap w-[220px] gap-1 hidden transition-opacity opacity-0';
    pickerEl.innerHTML = COMMON_EMOJIS.map(e => `<button type="button" class="btn-emoji p-1 text-xl hover:bg-gray-100 rounded">${e}</button>`).join('');
    document.body.appendChild(pickerEl);

    pickerEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('btn-emoji') && activeEmojiInput) {
        activeEmojiInput.value = target.innerText;
        closeEmojiPicker();
      }
    });

    document.addEventListener('click', (e) => {
      if (!activeEmojiInput || !pickerEl) return;
      const isInsidePicker = pickerEl.contains(e.target as Node);
      const isInsideInput = activeEmojiInput.contains(e.target as Node);
      if (!isInsidePicker && !isInsideInput) {
        closeEmojiPicker();
      }
    });
  } else {
    pickerEl = document.getElementById('global-emoji-picker');
  }
}

function showEmojiPicker(input: HTMLInputElement) {
  activeEmojiInput = input;
  if (!pickerEl) return;
  pickerEl.classList.remove('hidden');
  
  const rect = input.getBoundingClientRect();
  
  // Adjust to stay within screen bounds
  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;
  
  if (left + 220 > window.innerWidth) {
    left = window.innerWidth - 230;
  }
  
  pickerEl.style.top = `${top}px`;
  pickerEl.style.left = `${Math.max(10, left)}px`;
  
  requestAnimationFrame(() => pickerEl!.classList.add('opacity-100'));
}

function closeEmojiPicker() {
  if (!pickerEl) return;
  pickerEl.classList.remove('opacity-100');
  setTimeout(() => pickerEl?.classList.add('hidden'), 150);
  activeEmojiInput = null;
}

export async function renderSettings(container: HTMLElement) {
  initEmojiPicker();

  try {
    const cachedCategories = api.getCachedCategories();
    if (cachedCategories.length === 0 && !localStorage.getItem('cache_categories')) {
      throw new Error('No cache'); 
    }
    await updateSettingsView(container, true);
  } catch (e) {
    container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-gray-400">読み込み中...</div></div>`;
  }

  try {
    await updateSettingsView(container, false);
  } catch (error) {
    console.error(error);
    if (!localStorage.getItem('cache_categories')) {
      container.innerHTML = `<div class="p-4 text-red-500 text-center mt-10">データの取得に失敗しました。</div>`;
    }
  }
}

async function updateSettingsView(container: HTMLElement, useCache: boolean = false) {
  let categories: any[], recurrings: any[];
  if (useCache) {
    categories = api.getCachedCategories();
    recurrings = api.getCachedRecurringTasks();
  } else {
    [categories, recurrings] = await Promise.all([
      api.getCategories(),
      api.getRecurringTasks()
    ]);
  }

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const html = `
    <div class="h-full flex flex-col pt-8 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] overflow-y-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">設定</h1>

      <!-- Recurring tasks settings -->
      <section class="mb-8">
        <h2 class="text-lg font-bold text-gray-700 mb-3">繰り返し予定</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 p-4">
          <form id="form-add-recurring" class="flex flex-col gap-3">
            <div class="flex gap-2">
               <input type="text" name="title" placeholder="タイトル (例: 家賃)" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
               <input type="number" name="amount" placeholder="金額" required min="1" class="w-24 shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div class="flex gap-2">
               <input type="date" name="start_date" required class="w-32 shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
               <select name="frequency" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none">
                 <option value="" disabled selected>繰り返し頻度</option>
                 ${Object.entries(FREQUENCY_LABELS).map(([val, label]) => `<option value="${val}">${label}</option>`).join('')}
               </select>
            </div>
            <div class="flex gap-2">
               <select name="category_id" required class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none">
                 <option value="" disabled selected>カテゴリ</option>
                 <optgroup label="支出">
                  ${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                 </optgroup>
                 <optgroup label="収入">
                  ${incomeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                 </optgroup>
               </select>
               <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 rounded-lg transition-colors text-sm whitespace-nowrap">追加</button>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          ${recurrings.length === 0 ? '<div class="p-4 text-center text-sm text-gray-400">予定はありません</div>' : recurrings.map(r => `
            <div class="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <div>
                <div class="text-sm font-bold text-gray-800">${r.title}</div>
                <div class="text-xs text-gray-500">
                  ${r.start_date} から開始 / ${FREQUENCY_LABELS[r.frequency] || r.frequency} / ${r.categories?.icon} ${r.categories?.name} / ¥${r.amount.toLocaleString()}
                </div>
              </div>
              <button class="btn-delete-recurring p-2 text-gray-400 hover:text-red-500 transition-colors" data-id="${r.id}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Category settings -->
      <section class="mb-8">
        <h2 class="text-lg font-bold text-gray-700 mb-3">カテゴリ管理</h2>
        
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 p-4">
          <form id="form-add-category" class="flex items-center gap-1 sm:gap-2">
            <select name="type" required class="bg-gray-50 border border-gray-200 rounded-lg px-1 sm:px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none shrink-0">
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
            <input type="text" name="icon" placeholder="絵文字" required maxLength="2" class="emoji-input w-12 sm:w-16 text-center bg-gray-50 border border-gray-200 rounded-lg px-1 sm:px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 shrink-0" />
            <input type="text" name="name" placeholder="新カテゴリ" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm shrink-0 whitespace-nowrap">追加</button>
          </form>
        </div>

        <h3 class="text-sm font-bold text-gray-500 mb-2">支出カテゴリ</h3>
        <div id="expense-categories-list" class="flex flex-col gap-2 mb-6">
          ${expenseCategories.map(c => `
            <div class="category-item bg-white border border-gray-100 p-2 rounded-xl flex flex-col shadow-sm" data-id="${c.id}">
              <!-- View mode -->
              <div class="category-view flex items-center justify-between">
                <div class="flex items-center gap-2 overflow-hidden">
                  <div class="drag-handle cursor-grab text-gray-300 hover:text-gray-500 mr-1 p-1" title="並べ替え">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
                  </div>
                  <span class="text-lg w-6 text-center">${c.icon}</span>
                  <span class="text-sm font-medium text-gray-700 truncate">${c.name}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="btn-edit-category text-gray-400 hover:text-yellow-500 p-1 flex-shrink-0" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button class="btn-delete-category text-gray-400 hover:text-red-500 p-1 flex-shrink-0" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              <!-- Edit mode -->
              <form class="category-edit-form hidden flex items-center gap-1 sm:gap-2 mt-2 pt-2 border-t border-gray-50" data-id="${c.id}">
                <select name="type" required class="bg-gray-50 border border-gray-200 rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none shrink-0">
                  <option value="expense" ${c.type === 'expense' ? 'selected' : ''}>支出</option>
                  <option value="income" ${c.type === 'income' ? 'selected' : ''}>収入</option>
                </select>
                <input type="text" name="icon" value="${c.icon}" required maxLength="2" class="emoji-input w-8 sm:w-10 text-center bg-gray-50 border border-gray-200 rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 shrink-0" />
                <input type="text" name="name" value="${c.name}" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-2 py-1 rounded transition-colors text-xs shrink-0 whitespace-nowrap">保存</button>
                <button type="button" class="btn-cancel-edit bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2 py-1 rounded transition-colors text-xs shrink-0 whitespace-nowrap">取消</button>
              </form>
            </div>
          `).join('')}
        </div>

        <h3 class="text-sm font-bold text-gray-500 mb-2">収入カテゴリ</h3>
        <div id="income-categories-list" class="flex flex-col gap-2">
          ${incomeCategories.map(c => `
            <div class="category-item bg-white border border-gray-100 p-2 rounded-xl flex flex-col shadow-sm" data-id="${c.id}">
              <!-- View mode -->
              <div class="category-view flex items-center justify-between">
                <div class="flex items-center gap-2 overflow-hidden">
                  <div class="drag-handle cursor-grab text-gray-300 hover:text-gray-500 mr-1 p-1" title="並べ替え">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
                  </div>
                  <span class="text-lg w-6 text-center">${c.icon}</span>
                  <span class="text-sm font-medium text-gray-700 truncate">${c.name}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="btn-edit-category text-gray-400 hover:text-yellow-500 p-1 flex-shrink-0" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button class="btn-delete-category text-gray-400 hover:text-red-500 p-1 flex-shrink-0" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              <!-- Edit mode -->
              <form class="category-edit-form hidden flex items-center gap-1 sm:gap-2 mt-2 pt-2 border-t border-gray-50" data-id="${c.id}">
                <select name="type" required class="bg-gray-50 border border-gray-200 rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none shrink-0">
                  <option value="expense" ${c.type === 'expense' ? 'selected' : ''}>支出</option>
                  <option value="income" ${c.type === 'income' ? 'selected' : ''}>収入</option>
                </select>
                <input type="text" name="icon" value="${c.icon}" required maxLength="2" class="emoji-input w-8 sm:w-10 text-center bg-gray-50 border border-gray-200 rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 shrink-0" />
                <input type="text" name="name" value="${c.name}" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-2 py-1 rounded transition-colors text-xs shrink-0 whitespace-nowrap">保存</button>
                <button type="button" class="btn-cancel-edit bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2 py-1 rounded transition-colors text-xs shrink-0 whitespace-nowrap">取消</button>
              </form>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;

  // Event listeners for emoji input fields (both new addition and edit forms)
  const emojiInputs = container.querySelectorAll('.emoji-input') as NodeListOf<HTMLInputElement>;
  emojiInputs.forEach(input => {
    input.addEventListener('focus', () => showEmojiPicker(input));
    // Do not close on keydown to allow direct input
  });

  // Recurring form
  const recurringForm = document.getElementById('form-add-recurring') as HTMLFormElement;
  recurringForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(recurringForm);
    await api.addRecurringTask({
      title: data.get('title') as string,
      amount: Number(data.get('amount')),
      start_date: data.get('start_date') as string,
      frequency: data.get('frequency') as string,
      category_id: data.get('category_id') as string,
    });
    updateSettingsView(container);
  });

  // Add new category
  const categoryForm = document.getElementById('form-add-category') as HTMLFormElement;
  categoryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(categoryForm);
    await api.addCategory({
      name: data.get('name') as string,
      icon: data.get('icon') as string,
      type: data.get('type') as 'income' | 'expense'
    });
    closeEmojiPicker();
    updateSettingsView(container);
  });

  // Delete recurring task
  const delRecurringBtns = container.querySelectorAll('.btn-delete-recurring');
  delRecurringBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('この予定を削除しますか？')) return;
      const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
      await api.deleteRecurringTask(id);
      updateSettingsView(container);
    });
  });

  // Delete category
  const delCatBtns = container.querySelectorAll('.btn-delete-category');
  delCatBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('このカテゴリを削除すると、関連するデータが表示されなくなる可能性があります。削除しますか？')) return;
      const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
      await api.deleteCategory(id);
      updateSettingsView(container);
    });
  });

  // Switch to edit mode
  const editCatBtns = container.querySelectorAll('.btn-edit-category');
  editCatBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
      const itemEl = container.querySelector(`.category-item[data-id="${id}"]`)!;
      const viewEl = itemEl.querySelector('.category-view')!;
      const editEl = itemEl.querySelector('.category-edit-form')!;
      
      viewEl.classList.add('hidden');
      editEl.classList.remove('hidden');
    });
  });

  // Cancel category edit
  const cancelEditBtns = container.querySelectorAll('.btn-cancel-edit');
  cancelEditBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const formEl = (e.currentTarget as HTMLButtonElement).closest('.category-edit-form') as HTMLFormElement;
      const id = formEl.dataset.id!;
      const itemEl = container.querySelector(`.category-item[data-id="${id}"]`)!;
      const viewEl = itemEl.querySelector('.category-view')!;
      
      formEl.classList.add('hidden');
      viewEl.classList.remove('hidden');
      closeEmojiPicker();
    });
  });

  // Save category updates
  const editCatForms = container.querySelectorAll('.category-edit-form');
  editCatForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formEl = e.currentTarget as HTMLFormElement;
      const id = formEl.dataset.id!;
      const data = new FormData(formEl);
      
      const newType = data.get('type') as 'income' | 'expense';
      const newIcon = data.get('icon') as string;
      const newName = data.get('name') as string;
      
      await api.updateCategory(id, {
        type: newType,
        icon: newIcon,
        name: newName
      });
      
      closeEmojiPicker();
      updateSettingsView(container);
    });
  });

  // Initialize SortableJS
  const initSortable = (selector: string) => {
    const el = container.querySelector(selector) as HTMLElement;
    if (el) {
      Sortable.create(el, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: async (evt) => {
          const listEl = evt.to;
          const items = Array.from(listEl.querySelectorAll('.category-item'));
          const updates = items.map((item, index) => ({
            id: (item as HTMLElement).dataset.id!,
            sort_order: index,
          }));
          try {
            await api.updateCategoryOrders(updates);
            // Update cache to maintain sorted state
            const cache = api.getCachedCategories();
            updates.forEach(u => {
              const c = cache.find(cat => cat.id === u.id);
              if (c) c.sort_order = u.sort_order;
            });
            cache.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            localStorage.setItem('cache_categories', JSON.stringify(cache));
          } catch(e) {
            console.error('Failed to update sort order', e);
            alert('並び順の保存に失敗しました');
          }
        }
      });
    }
  };

  initSortable('#expense-categories-list');
  initSortable('#income-categories-list');
}
