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

    let [allAssets, profiles] = await Promise.all([
      api.getAllAssets(),
      api.getProfiles()
    ]);

    if (currentUserEmail && !allAssets.some(a => a.author_name === currentUserEmail)) {
        allAssets.push({ id: '', bank: 0, cashless: 0, cash: 0, author_name: currentUserEmail });
    }

    const render = () => {
      let totalAssets = 0;
      let totalLiabilities = 0;

      allAssets.forEach(asset => {
          const amounts = [asset.bank || 0, asset.cashless || 0, asset.cash || 0];
          amounts.forEach(amt => {
              if (amt >= 0) totalAssets += amt;
              else totalLiabilities += amt;
          });
      });

      const netAssets = totalAssets + totalLiabilities;

      let html = `<div class="p-6 bg-[#fafafa] min-h-full pb-28 relative font-sans">`;
      
      // Top Header
      html += `
        <div class="flex justify-between items-center mb-6 pt-2">
          <div class="text-gray-500 font-medium text-sm flex items-center gap-2 cursor-pointer">
            今日まで 
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div class="text-gray-400 text-sm flex items-center gap-1.5 cursor-pointer relative">
            <div class="absolute -top-3.5 -right-3 text-[#fbbd23]">
               <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.36 6.26L21 9.27l-4.5 4.87 1.18 6.88L12 17.77l-5.68 3.25 1.18-6.88L3 9.27l6.64-1.01L12 2z"/></svg>
            </div>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            推移
          </div>
        </div>
      `;

      // Main Card
      html += `
        <div class="bg-gradient-to-br from-[#8d8d8d] to-[#6d6d6d] rounded-[24px] p-6 text-white shadow-md mb-8 relative overflow-hidden h-44 flex flex-col justify-center">
          <div class="absolute -right-16 -top-16 w-56 h-56 bg-white opacity-[0.04] rounded-full"></div>
          <div class="absolute right-4 -bottom-16 w-48 h-48 bg-white opacity-[0.04] rounded-full"></div>
          
          <div class="text-center mb-6 relative z-10 mt-2">
            <div class="text-gray-200 text-[11px] font-medium tracking-wider mb-1">純資産</div>
            <div class="text-[32px] font-bold tracking-tight">¥ ${netAssets.toLocaleString()}</div>
          </div>
          
          <div class="flex justify-between relative z-10 px-6">
            <div class="text-center flex-1">
              <div class="text-gray-200 text-[11px] font-medium tracking-wider mb-1">総資産</div>
              <div class="text-[15px] font-bold tracking-wide">¥ ${totalAssets.toLocaleString()}</div>
            </div>
            <div class="text-center flex-1">
              <div class="text-gray-200 text-[11px] font-medium tracking-wider mb-1">負債</div>
              <div class="text-[15px] font-bold tracking-wide">¥ ${Math.abs(totalLiabilities).toLocaleString()}</div>
            </div>
          </div>
        </div>
      `;

      allAssets.forEach(asset => {
        const profile = profiles.find(p => p.email === asset.author_name);
        let defaultName = asset.author_name ? asset.author_name.split('@')[0] : 'ゲスト';
        const displayName = profile?.display_name || defaultName;
        const totalAmount = (asset.bank || 0) + (asset.cashless || 0) + (asset.cash || 0);

        html += `
          <div class="mb-8">
            <div class="flex justify-between items-center mb-3 px-1">
              <div class="text-gray-400 font-medium text-[13px]">${displayName}</div>
              <div class="text-gray-600 font-semibold text-[13px] tracking-wide">¥ ${totalAmount.toLocaleString()}</div>
            </div>

            <div class="space-y-3">
              ${renderAssetCard(asset.id || '', 'bank', '口座', '🏦', asset.bank || 0, asset.author_name || '', displayName)}
              ${renderAssetCard(asset.id || '', 'cashless', 'クレジットカード', '💳', asset.cashless || 0, asset.author_name || '', displayName)}
              ${renderAssetCard(asset.id || '', 'cash', '現金', '💴', asset.cash || 0, asset.author_name || '', displayName)}
            </div>
          </div>
        `;
      });

      html += `</div>`;

      // モーダル
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
        <div data-edit-id="${id}" data-edit-type="${type}" data-edit-name="${subtitle}" data-edit-amount="${amount || 0}" data-edit-author="${authorName}" class="edit-asset-btn bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer active:scale-95 transition-all outline-none select-none">
          <div class="flex items-center gap-4">
            ${avatarHtml}
            <div>
              <div class="text-gray-700 font-medium text-[15px]">${displayName}</div>
              <div class="text-gray-400 text-[11px] mt-0.5">${subtitle}</div>
            </div>
          </div>
          <div class="${amountClass} font-medium tracking-wide">¥ ${(amount || 0).toLocaleString()}</div>
        </div>
      `;
    };

    const attachEventListeners = () => {
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
        
        const originalText = btnSave.textContent;
        btnSave.textContent = '保存中...';
        btnSave.setAttribute('disabled', 'true');
        btnSave.classList.add('opacity-50', 'cursor-not-allowed');

        try {
          const updates: any = { [type]: newValue };
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
