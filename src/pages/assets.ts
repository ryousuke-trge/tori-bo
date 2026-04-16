import { api } from '../api';
import { supabase } from '../supabase';
import type { AssetEntry } from '../types';

export async function renderAssets(container: HTMLElement) {

  container.innerHTML = `
    <div class="flex items-center justify-center h-full">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
    </div>
  `;

  try {

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserEmail = sessionData.session?.user?.email;

    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    const endOfThisMonth = new Date(todayY, now.getMonth() + 1, 0);
    const eomY = endOfThisMonth.getFullYear();
    const eomM = String(endOfThisMonth.getMonth() + 1).padStart(2, '0');
    const eomD = String(endOfThisMonth.getDate()).padStart(2, '0');
    const endOfMonthStr = `${eomY}-${eomM}-${eomD}`;

    let [allAssets, profiles, futureTxs] = await Promise.all([
      api.getAllAssets(),
      api.getProfiles(),
      api.getTransactions(todayStr, '2099-12-31')
    ]);

    allAssets = allAssets.filter(asset => {
      const isCurrentUser = asset.author_name === currentUserEmail;
      const isRegisteredProfile = profiles.some(p => p.email === asset.author_name);
      return isCurrentUser || isRegisteredProfile;
    });

    const futureDeltas = new Map<string, { bank: number, cashless: number, cash: number }>();
    const monthEndDeltas = new Map<string, { bank: number, cashless: number, cash: number }>();

    futureTxs.forEach(tx => {
      if (!tx.asset_type) return;
      const author = tx.author_name || '';

      if (!futureDeltas.has(author)) futureDeltas.set(author, { bank: 0, cashless: 0, cash: 0 });
      if (!monthEndDeltas.has(author)) monthEndDeltas.set(author, { bank: 0, cashless: 0, cash: 0 });

      const isIncome = tx.categories?.type === 'income';
      const amt = isIncome ? tx.amount : -tx.amount;
      const key = tx.asset_type as 'bank' | 'cashless' | 'cash';

      if (tx.date > todayStr) {
        futureDeltas.get(author)![key] += amt;
      }

      if (tx.date > endOfMonthStr) {
        monthEndDeltas.get(author)![key] += amt;
      }
    });

    if (currentUserEmail && !allAssets.some(a => a.author_name === currentUserEmail)) {
        allAssets.push({ id: '', bank: 0, cashless: 0, cash: 0, author_name: currentUserEmail });
    }

    let currentPeriod: 'today' | 'monthend' = 'today';

    const render = () => {
      let totalAssets = 0;
      let totalLiabilities = 0;

      const adjustedAssets = allAssets.map(asset => {
        const author = asset.author_name || '';
        let bank = asset.bank || 0;
        let cashless = asset.cashless || 0;
        let cash = asset.cash || 0;

        if (currentPeriod === 'today') {

          const fd = futureDeltas.get(author) || { bank: 0, cashless: 0, cash: 0 };
          bank -= fd.bank;
          cashless -= fd.cashless;
          cash -= fd.cash;
        } else if (currentPeriod === 'monthend') {

          const md = monthEndDeltas.get(author) || { bank: 0, cashless: 0, cash: 0 };
          bank -= md.bank;
          cashless -= md.cashless;
          cash -= md.cash;
        }

        return { ...asset, bank, cashless, cash };
      });

      adjustedAssets.forEach(asset => {
          const amounts = [asset.cash || 0];
          amounts.forEach(amt => {
              if (amt >= 0) totalAssets += amt;
              else totalLiabilities += amt;
          });
      });

      const netAssets = totalAssets + totalLiabilities;

      let html = `<div class="p-6 bg-[#fafafa] min-h-full pb-28 relative font-sans">`;

      html += `
        <div class="flex items-center gap-6 mb-6 pt-2">
          <div id="tab-today" class="text-sm font-medium cursor-pointer transition-colors ${currentPeriod === 'today' ? 'text-gray-800 border-b-2 border-[#7ddb87] pb-1' : 'text-gray-400 pb-1'}">
            今日まで
          </div>
          <div id="tab-monthend" class="text-sm font-medium cursor-pointer transition-colors ${currentPeriod === 'monthend' ? 'text-gray-800 border-b-2 border-[#7ddb87] pb-1' : 'text-gray-400 pb-1'}">
            今月末まで
          </div>
        </div>
      `;

      html += `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 mt-2 flex flex-col items-center justify-center">
          <div class="text-sm text-gray-500 font-medium mb-2 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3z"/></svg>
            家族の合計残高
          </div>
          <div class="text-[32px] font-bold text-gray-800 tracking-tight">¥ ${netAssets.toLocaleString()}</div>
        </div>
      `;

      adjustedAssets.forEach(asset => {
        const profile = profiles.find(p => p.email === asset.author_name);
        let defaultName = asset.author_name ? asset.author_name.split('@')[0] : 'ゲスト';
        const displayName = profile?.display_name || defaultName;
        const totalAmount = asset.cash || 0;

        html += `
          <div class="mb-8">
            <div class="flex justify-between items-center mb-3 px-1">
              <div class="text-gray-400 font-medium text-[13px]">${displayName}</div>
              <div class="text-gray-600 font-semibold text-[13px] tracking-wide">¥ ${totalAmount.toLocaleString()}</div>
            </div>

            <div class="space-y-3">
              ${renderAssetCard(asset.id || '', 'cash', '現金', '💴', asset.cash || 0, asset.author_name || '', displayName)}
            </div>
          </div>
        `;
      });

      html += `</div>`;

      html += `
        <div id="edit-asset-modal" class="fixed inset-0 bg-black/40 hidden items-center justify-center z-[100] backdrop-blur-sm transition-opacity opacity-0 px-4">
          <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
            <h3 class="text-lg font-bold text-gray-800 mb-5 text-center" id="edit-modal-title">金額を編集</h3>
            <input type="number" id="edit-asset-input" class="w-full bg-[#f4f4f4] border-none rounded-2xl p-4 text-center text-2xl font-bold text-gray-800 focus:ring-2 focus:ring-[#70ca7a] mb-6 outline-none" placeholder="0">
            <input type="hidden" id="edit-asset-type">
            <input type="hidden" id="edit-asset-id">
            <input type="hidden" id="edit-asset-author">
            <div class="flex gap-3">
              <button id="btn-cancel-edit" class="flex-1 py-3.5 px-4 bg-gray-100 text-gray-600 font-medium rounded-2xl hover:bg-gray-200 transition-colors">キャンセル</button>
              <button id="btn-save-edit" class="flex-1 py-3.5 px-4 bg-[#7ddb87] text-white font-bold rounded-2xl shadow-md shadow-[#7ddb87]/30 hover:bg-[#6fc47c] transition-colors">保存</button>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
      attachEventListeners();
    };

    const renderAssetCard = (id: string, type: string, subtitle: string, icon: string, amount: number, authorName: string, displayName: string) => {
      const amountClass = amount < 0 ? "text-red-400" : "text-[#62d278]";

      let avatarHtml = `
        <div class="w-10 h-10 bg-[#f4f7f9] text-gray-500 rounded-full flex items-center justify-center text-xl shadow-sm">
          ${icon}
        </div>
      `;

      return `
        <div data-edit-id="${id}" data-edit-type="${type}" data-edit-name="${subtitle}" data-edit-amount="${amount || 0}" data-edit-author="${authorName}" class="edit-asset-btn bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer active:scale-95 transition-all outline-none select-none hover:bg-gray-50">
          <div class="flex items-center gap-4">
            ${avatarHtml}
            <div>
              <div class="text-gray-700 font-medium text-[15px]">${displayName}</div>
              <div class="text-gray-400 text-[11px] mt-0.5">${subtitle}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="${amountClass} font-medium tracking-wide">¥ ${(amount || 0).toLocaleString()}</div>
            <div class="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-gray-200 transition-colors" title="編集">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </div>
          </div>
        </div>
      `;
    };

    const attachEventListeners = () => {
      const tabToday = document.getElementById('tab-today');
      const tabMonthEnd = document.getElementById('tab-monthend');

      tabToday?.addEventListener('click', () => {
        if (currentPeriod !== 'today') {
          currentPeriod = 'today';
          render();
        }
      });

      tabMonthEnd?.addEventListener('click', () => {
        if (currentPeriod !== 'monthend') {
          currentPeriod = 'monthend';
          render();
        }
      });

      const modal = document.getElementById('edit-asset-modal');
      const titleEl = document.getElementById('edit-modal-title');
      const inputEl = document.getElementById('edit-asset-input') as HTMLInputElement;
      const typeEl = document.getElementById('edit-asset-type') as HTMLInputElement;
      const idEl = document.getElementById('edit-asset-id') as HTMLInputElement;
      const authorEl = document.getElementById('edit-asset-author') as HTMLInputElement;
      const btnCancel = document.getElementById('btn-cancel-edit');
      const btnSave = document.getElementById('btn-save-edit');

      const openModal = (id: string, type: string, name: string, amount: number, authorName: string) => {
        if (!modal || !titleEl || !inputEl || !typeEl || !idEl || !authorEl) return;

        titleEl.textContent = `${name}の残高`;
        inputEl.value = amount.toString();
        typeEl.value = type;
        idEl.value = id;
        authorEl.value = authorName;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.firstElementChild?.classList.remove('scale-95');

        setTimeout(() => {
          inputEl.focus();
          inputEl.select();
        }, 50);
      };

      const closeModal = () => {
        if (!modal) return;
        modal.classList.add('opacity-0');
        modal.firstElementChild?.classList.add('scale-95');

        setTimeout(() => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }, 300);
      };

      document.querySelectorAll('.edit-asset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLDivElement;
          const id = target.getAttribute('data-edit-id') || '';
          const type = target.getAttribute('data-edit-type') || '';
          const name = target.getAttribute('data-edit-name') || '';
          const author = target.getAttribute('data-edit-author') || '';
          const amount = parseInt(target.getAttribute('data-edit-amount') || '0', 10);
          openModal(id, type, name, amount, author);
        });
      });

      btnCancel?.addEventListener('click', closeModal);
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      btnSave?.addEventListener('click', async () => {
        if (!inputEl || !typeEl || !btnSave || !idEl || !authorEl) return;

        const newValue = parseInt(inputEl.value || '0', 10);
        const type = typeEl.value as keyof Pick<AssetEntry, 'bank'|'cashless'|'cash'>;
        const targetId = idEl.value;
        const targetAuthor = authorEl.value;

        let adjustedValue = newValue;
        if (currentPeriod === 'today') {
          const fd = futureDeltas.get(targetAuthor) || { bank: 0, cashless: 0, cash: 0 };
          adjustedValue += fd[type];
        } else if (currentPeriod === 'monthend') {
          const md = monthEndDeltas.get(targetAuthor) || { bank: 0, cashless: 0, cash: 0 };
          adjustedValue += md[type];
        }

        const originalText = btnSave.textContent;
        btnSave.textContent = '保存中...';
        btnSave.setAttribute('disabled', 'true');
        btnSave.classList.add('opacity-50', 'cursor-not-allowed');

        try {
          const updates: any = { [type]: adjustedValue };
          if (!targetId && targetAuthor) {
            updates.author_name = targetAuthor;
          }

          const updatedAsset = await api.updateAssets(targetId, updates);

          const idx = allAssets.findIndex(a => targetId ? a.id === targetId : a.author_name === targetAuthor);
          if (idx >= 0) {
            allAssets[idx] = updatedAsset;
          } else {
            allAssets.push(updatedAsset);
          }

          closeModal();
          setTimeout(render, 300);
        } catch (err) {
          console.error(err);
          alert('保存に失敗しました');
        } finally {
          btnSave.textContent = originalText;
          btnSave.removeAttribute('disabled');
          btnSave.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });
    };

    render();

  } catch (err) {

    console.error(err);
    container.innerHTML = `
      <div class="p-8 text-center bg-gray-50 h-full flex flex-col justify-center">
        <div class="text-4xl mb-4">😢</div>
        <div class="text-red-500 font-bold mb-2">データの読み込みに失敗しました。</div>
        <div class="text-sm text-gray-500">ネットワーク接続を確認するか、リロードしてください。</div>
      </div>
    `;
  }
}
