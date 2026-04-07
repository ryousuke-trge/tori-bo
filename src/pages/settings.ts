import { api } from '../api';
// import type { Category } from '../types';

export async function renderSettings(container: HTMLElement) {
  // まずキャッシュを使って即座に描画
  try {
    const cachedCategories = api.getCachedCategories();
    if (cachedCategories.length === 0 && !localStorage.getItem('cache_categories')) {
      throw new Error('No cache'); // まだ一度もAPI叩いてない場合はLoadingを出す
    }
    await updateSettingsView(container, true);
  } catch (e) {
    container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-gray-400">読み込み中...</div></div>`;
  }

  // 裏で最新データを取得し再描画
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
    <div class="h-full flex flex-col pt-8 px-4 pb-20 overflow-y-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">設定</h1>

      <!-- 繰り返し予定設定 -->
      <section class="mb-8">
        <h2 class="text-lg font-bold text-gray-700 mb-3">繰り返し予定</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 p-4">
          <form id="form-add-recurring" class="flex flex-col gap-3">
            <div class="flex gap-2">
               <input type="text" name="title" placeholder="タイトル (例: 家賃)" required class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
               <input type="number" name="amount" placeholder="金額" required min="1" class="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex gap-2">
               <select name="day_of_month" required class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                 <option value="" disabled selected>発生日</option>
                 ${Array.from({length:31}, (_,i) => `<option value="${i+1}">毎月${i+1}日</option>`).join('')}
                 <option value="31">月末 (31日扱い)</option>
               </select>
               <select name="category_id" required class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                 <option value="" disabled selected>カテゴリ</option>
                 <optgroup label="支出">
                  ${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                 </optgroup>
                 <optgroup label="収入">
                  ${incomeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                 </optgroup>
               </select>
               <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-lg transition-colors text-sm whitespace-nowrap">追加</button>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          ${recurrings.length === 0 ? '<div class="p-4 text-center text-sm text-gray-400">予定はありません</div>' : recurrings.map(r => `
            <div class="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <div>
                <div class="text-sm font-bold text-gray-800">${r.title}</div>
                <div class="text-xs text-gray-500">
                  毎月${r.day_of_month === 31 ? '末' : r.day_of_month + '日'} / ${r.categories?.icon} ${r.categories?.name} / ¥${r.amount.toLocaleString()}
                </div>
              </div>
              <button class="btn-delete-recurring p-2 text-gray-400 hover:text-red-500 transition-colors" data-id="${r.id}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- カテゴリ設定 -->
      <section class="mb-8">
        <h2 class="text-lg font-bold text-gray-700 mb-3">カテゴリ</h2>
        
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 p-4">
          <form id="form-add-category" class="flex items-center gap-2">
            <select name="type" required class="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
            <input type="text" name="icon" placeholder="絵文字" required maxLength="2" class="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" name="name" placeholder="新しいカテゴリ" required class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm">追加</button>
          </form>
        </div>

        <div class="grid grid-cols-2 gap-2">
          ${categories.map(c => `
            <div class="bg-white border border-gray-100 p-2 rounded-xl flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-2 overflow-hidden">
                <span class="text-lg">${c.icon}</span>
                <span class="text-sm font-medium text-gray-700 truncate">${c.name}</span>
                <span class="text-[10px] text-gray-400 border border-gray-200 rounded px-1">${c.type === 'income' ? '収' : '支'}</span>
              </div>
              <button class="btn-delete-category text-gray-400 hover:text-red-500 p-1 flex-shrink-0" data-id="${c.id}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;

  // イベントリスナー
  const recurringForm = document.getElementById('form-add-recurring') as HTMLFormElement;
  recurringForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(recurringForm);
    await api.addRecurringTask({
      title: data.get('title') as string,
      amount: Number(data.get('amount')),
      day_of_month: Number(data.get('day_of_month')),
      category_id: data.get('category_id') as string,
    });
    updateSettingsView(container);
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
    updateSettingsView(container);
  });

  const delRecurringBtns = container.querySelectorAll('.btn-delete-recurring');
  delRecurringBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('この予定を削除しますか？')) return;
      const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
      await api.deleteRecurringTask(id);
      updateSettingsView(container);
    });
  });

  const delCatBtns = container.querySelectorAll('.btn-delete-category');
  delCatBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('このカテゴリを削除すると、関連するデータが表示されなくなる可能性があります。削除しますか？')) return;
      const id = (e.currentTarget as HTMLButtonElement).dataset.id!;
      await api.deleteCategory(id);
      updateSettingsView(container);
    });
  });
}
