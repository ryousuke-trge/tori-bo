export function showMonthPicker(currentYear: number, currentMonth: number, onSelect: (year: number, month: number) => void) {

  let selectedYear = currentYear;

  const modal = document.createElement('div');

  modal.className = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200 opacity-0";

  const renderContent = () => {

    let html = `
      <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-transform" onclick="event.stopPropagation()">
        <div class="p-5 flex items-center justify-between border-b border-gray-100">
          <button id="mp-prev-year" type="button" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div class="font-bold text-xl text-gray-800">${selectedYear}年</div>
          <button id="mp-next-year" type="button" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div class="p-6 grid grid-cols-3 gap-3">
    `;

    for(let m=0; m<12; m++) {

      const isCurrent = selectedYear === currentYear && m === currentMonth;
      const bgClass = isCurrent ? "bg-yellow-400 text-white font-bold shadow-md" : "bg-gray-50 hover:bg-yellow-50 text-gray-700 hover:text-yellow-600";

      html += `<button type="button" class="mp-month-btn py-3 rounded-xl text-center transition-all ${bgClass}" data-month="${m}">${m+1}月</button>`;
    }

    html += `
        </div>
        <div class="pb-5 text-center">
          <button id="mp-close" type="button" class="text-sm font-semibold text-gray-400 hover:text-gray-600 py-2 px-6 rounded-full hover:bg-gray-50 transition-colors">キャンセル</button>
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

  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });
}
