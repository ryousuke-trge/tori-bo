import { api } from '../api';
import Sortable from 'sortablejs';
import { supabase } from '../supabase';

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

let currentView: 'main' | 'category' | 'recurring' = 'main';
let stateData: { user: any; categories: any[]; recurrings: any[]; profiles: any[] } | null = null;

export async function renderSettings(container: HTMLElement) {
  initEmojiPicker();
  currentView = 'main';

  try {
    const cachedCategories = api.getCachedCategories();
    if (cachedCategories.length === 0 && !localStorage.getItem('cache_categories')) {
      throw new Error('No cache');
    }
    await updateSettingsData(container, true);
  } catch (e) {
    container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-gray-400">読み込み中...</div></div>`;
  }

  try {
    await updateSettingsData(container, false);
  } catch (error) {
    console.error(error);
    if (!localStorage.getItem('cache_categories')) {
      container.innerHTML = `<div class="p-4 text-red-500 text-center mt-10">データの取得に失敗しました。</div>`;
    }
  }
}

async function updateSettingsData(container: HTMLElement, useCache: boolean = false) {
  const [{ data: sessionData }] = await Promise.all([
    supabase.auth.getSession()
  ]);
  const user = sessionData.session?.user;

  let categories: any[], recurrings: any[], profiles: any[];
  if (useCache) {
    categories = api.getCachedCategories();
    recurrings = api.getCachedRecurringTasks();
    profiles = api.getCachedProfiles();
  } else {
    [categories, recurrings, profiles] = await Promise.all([
      api.getCategories(),
      api.getRecurringTasks(),
      api.getProfiles()
    ]);
  }

  stateData = { user, categories, recurrings, profiles };
  renderCurrentView(container);
}

function renderCurrentView(container: HTMLElement) {
  if (!stateData) return;

  const { user, categories, recurrings, profiles } = stateData;
  const myProfile = profiles?.find((p: any) => p.email === user?.email);
  const displayName = myProfile?.display_name || '';

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  if (currentView === 'main') {
    const html = `
      <div class="h-full flex flex-col pt-8 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] overflow-y-auto">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">設定</h1>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-gray-700 mb-3">アカウント</h2>
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                ${displayName ? displayName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || 'U')}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-gray-800 truncate">${displayName || '表示名未設定'}</div>
                <div class="text-xs text-gray-500 truncate">${user?.email || '未ログイン'}</div>
              </div>
            </div>

            <form id="form-update-profile" class="flex gap-2">
              <input type="text" name="display_name" value="${displayName}" placeholder="表示名 (例: 涼介)" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 rounded-lg transition-colors text-sm whitespace-nowrap">保存</button>
            </form>

            <button id="btn-logout" class="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl border border-gray-200 transition-colors text-sm">
              ログアウト
            </button>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-gray-700 mb-3">詳細設定</h2>
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div id="btn-go-category" class="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <svg class="w-4 h-4 text-currentColor" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                </div>
                <span class="font-bold text-gray-700">カテゴリ管理</span>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>

            <div id="btn-go-recurring" class="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                  <svg class="w-4 h-4 text-currentColor" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <span class="font-bold text-gray-700">繰り返し予定</span>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </section>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('btn-go-category')?.addEventListener('click', () => {
      currentView = 'category';
      renderCurrentView(container);
    });

    document.getElementById('btn-go-recurring')?.addEventListener('click', () => {
      currentView = 'recurring';
      renderCurrentView(container);
    });

    const profileForm = document.getElementById('form-update-profile') as HTMLFormElement;
    profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!user?.email) return;

      const data = new FormData(profileForm);
      const newName = data.get('display_name') as string;

      const submitBtn = profileForm.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = '保存中...';
      try {
        await api.upsertProfile(user.email, newName);
        await updateSettingsData(container);
      } catch (err) {
        console.error(err);
        alert('表示名の保存に失敗しました。');
        submitBtn.disabled = false;
        submitBtn.textContent = '保存';
      }
    });

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        if (!confirm('ログアウトしますか？')) return;
        await api.logout();
      });
    }

  } else if (currentView === 'recurring') {
    const html = `
      <div class="h-full flex flex-col pt-8 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] overflow-y-auto bg-gray-50">
        <div class="flex items-center gap-3 mb-6">
          <button id="btn-back" class="p-2 -ml-2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 class="text-xl font-bold text-gray-800">繰り返し予定</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
          <h2 class="text-sm font-bold text-gray-500 mb-3">新しい予定を追加</h2>
          <form id="form-add-recurring" class="flex flex-col gap-3">
            <div class="flex gap-2">
               <input type="text" name="title" placeholder="タイトル (例: 家賃)" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
               <input type="number" name="amount" placeholder="金額" required min="1" class="w-24 shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div class="flex gap-2">
               <input type="date" name="start_date" required class="w-32 shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
               <select name="frequency" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none">
                 <option value="" disabled selected>繰り返し頻度</option>
                 ${Object.entries(FREQUENCY_LABELS).map(([val, label]) => `<option value="${val}">${label}</option>`).join('')}
               </select>
            </div>
            <div class="flex gap-2">
               <select name="category_id" required class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none">
                 <option value="" disabled selected>カテゴリ</option>
                 <optgroup label="支出">
                  ${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                 </optgroup>
                 <optgroup label="収入">
                  ${incomeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                 </optgroup>
               </select>
               <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 rounded-lg transition-colors text-sm whitespace-nowrap shadow-sm">追加</button>
            </div>
          </form>
        </div>

        <h2 class="text-sm font-bold text-gray-500 mb-2">登録済みの予定</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          ${recurrings.length === 0 ? '<div class="p-6 text-center text-sm text-gray-400">予定はありません</div>' : recurrings.map(r => `
            <div class="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl shrink-0 border border-gray-200">
                  ${r.categories?.icon}
                </div>
                <div>
                  <div class="text-sm font-bold text-gray-800">${r.title}</div>
                  <div class="text-[11px] text-gray-500 mt-0.5">
                    ${r.start_date} から開始 / ${FREQUENCY_LABELS[r.frequency] || r.frequency} / ¥${r.amount.toLocaleString()}
                  </div>
                </div>
              </div>
              <button class="btn-delete-recurring p-2 text-gray-300 hover:text-red-500 transition-colors focus:outline-none bg-white rounded-full border border-gray-100 shadow-sm ml-2 shrink-0" data-id="${r.id}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('btn-back')?.addEventListener('click', () => {
      currentView = 'main';
      renderCurrentView(container);
    });

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
      await updateSettingsData(container);
    });

    const delRecurringBtns = container.querySelectorAll('.btn-delete-recurring');
    delRecurringBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('この予定を削除しますか？')) return;
        const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
        await api.deleteRecurringTask(id);
        await updateSettingsData(container);
      });
    });

  } else if (currentView === 'category') {
    const html = `
      <div class="h-full flex flex-col pt-8 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] overflow-y-auto bg-gray-50">
        <div class="flex items-center gap-3 mb-6">
          <button id="btn-back" class="p-2 -ml-2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 class="text-xl font-bold text-gray-800">カテゴリ管理</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
          <h2 class="text-sm font-bold text-gray-500 mb-3">新しいカテゴリを追加</h2>
          <form id="form-add-category" class="flex items-center gap-1 sm:gap-2">
            <select name="type" required class="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none shrink-0 border-r-8 border-transparent">
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
            <input type="text" name="icon" placeholder="絵文字" required maxLength="2" class="emoji-input w-16 text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 shrink-0" />
            <input type="text" name="name" placeholder="カテゴリ名" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm shrink-0 whitespace-nowrap shadow-sm">追加</button>
          </form>
        </div>

        <h3 class="text-sm font-bold text-gray-500 mb-2">支出カテゴリ</h3>
        <div id="expense-categories-list" class="flex flex-col gap-2 mb-8">
          ${expenseCategories.map(c => `
            <div class="category-item bg-white border border-gray-100 p-3 rounded-xl flex flex-col shadow-sm" data-id="${c.id}">

              <div class="category-view flex items-center justify-between">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="drag-handle cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing p-1" title="並べ替え">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl shrink-0">${c.icon}</div>
                  <span class="text-sm font-bold text-gray-700 truncate">${c.name}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0 ml-2">
                  <button class="btn-edit-category text-gray-400 hover:text-yellow-500 p-2 rounded-full hover:bg-yellow-50 transition-colors" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button class="btn-delete-category text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <form class="category-edit-form hidden flex items-center gap-1 sm:gap-2 mt-3 pt-3 border-t border-gray-50" data-id="${c.id}">
                <select name="type" required class="bg-gray-50 border border-gray-200 rounded-md px-1 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none shrink-0 border-r-4 border-transparent">
                  <option value="expense" ${c.type === 'expense' ? 'selected' : ''}>支出</option>
                  <option value="income" ${c.type === 'income' ? 'selected' : ''}>収入</option>
                </select>
                <input type="text" name="icon" value="${c.icon}" required maxLength="2" class="emoji-input w-10 text-center bg-gray-50 border border-gray-200 rounded-md px-1 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 shrink-0" />
                <input type="text" name="name" value="${c.name}" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-3 py-1.5 rounded transition-colors text-xs shrink-0 whitespace-nowrap shadow-sm">保存</button>
                <button type="button" class="btn-cancel-edit bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1.5 rounded transition-colors text-xs shrink-0 whitespace-nowrap">取消</button>
              </form>
            </div>
          `).join('')}
        </div>

        <h3 class="text-sm font-bold text-gray-500 mb-2">収入カテゴリ</h3>
        <div id="income-categories-list" class="flex flex-col gap-2 mb-8">
          ${incomeCategories.map(c => `
            <div class="category-item bg-white border border-gray-100 p-3 rounded-xl flex flex-col shadow-sm" data-id="${c.id}">

              <div class="category-view flex items-center justify-between">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="drag-handle cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing p-1" title="並べ替え">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl shrink-0">${c.icon}</div>
                  <span class="text-sm font-bold text-gray-700 truncate">${c.name}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0 ml-2">
                  <button class="btn-edit-category text-gray-400 hover:text-yellow-500 p-2 rounded-full hover:bg-yellow-50 transition-colors" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button class="btn-delete-category text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" data-id="${c.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <form class="category-edit-form hidden flex items-center gap-1 sm:gap-2 mt-3 pt-3 border-t border-gray-50" data-id="${c.id}">
                <select name="type" required class="bg-gray-50 border border-gray-200 rounded-md px-1 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none shrink-0 border-r-4 border-transparent">
                  <option value="expense" ${c.type === 'expense' ? 'selected' : ''}>支出</option>
                  <option value="income" ${c.type === 'income' ? 'selected' : ''}>収入</option>
                </select>
                <input type="text" name="icon" value="${c.icon}" required maxLength="2" class="emoji-input w-10 text-center bg-gray-50 border border-gray-200 rounded-md px-1 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 shrink-0" />
                <input type="text" name="name" value="${c.name}" required class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-3 py-1.5 rounded transition-colors text-xs shrink-0 whitespace-nowrap shadow-sm">保存</button>
                <button type="button" class="btn-cancel-edit bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1.5 rounded transition-colors text-xs shrink-0 whitespace-nowrap">取消</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('btn-back')?.addEventListener('click', () => {
      currentView = 'main';
      renderCurrentView(container);
    });

    const emojiInputs = container.querySelectorAll('.emoji-input') as NodeListOf<HTMLInputElement>;
    emojiInputs.forEach(input => {
      input.addEventListener('focus', () => showEmojiPicker(input));
    });

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
      await updateSettingsData(container);
    });

    const delCatBtns = container.querySelectorAll('.btn-delete-category');
    delCatBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('このカテゴリを削除すると、関連するデータが表示されなくなる可能性があります。削除しますか？')) return;
        const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
        await api.deleteCategory(id);
        await updateSettingsData(container);
      });
    });

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
        await updateSettingsData(container);
      });
    });

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
}
