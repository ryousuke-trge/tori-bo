import { getCalendarGrid, formatDate } from '../utils/date';
import * as JapaneseHolidays from 'japanese-holidays';

interface DaySummary {
  income: number;
  expense: number;
}

export function renderCalendar(
  container: HTMLElement,
  year: number,
  month: number, // 0-indexed month (0 = Jan)
  summaryByDate: Record<string, DaySummary>,
  selectedDateStr: string | null = null
) {
  const grid = getCalendarGrid(year, month);
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

  let html = `<div class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden mt-4">`;
  
  // Days of week header
  for (const day of daysOfWeek) {
    const isSun = day === '日';
    const isSat = day === '土';
    let textColorClass = "text-gray-500";
    if (isSun) textColorClass = "text-red-500";
    if (isSat) textColorClass = "text-blue-500";

    html += `<div class="bg-gray-50 py-2 text-center text-xs font-medium ${textColorClass}">${day}</div>`;
  }

  // Date cells
  for (const dateObj of grid) {
    const dateStr = formatDate(dateObj);
    const summary = summaryByDate[dateStr] || { income: 0, expense: 0 };
    const isCurrentMonth = dateObj.getMonth() === month;
    const isSelected = dateStr === selectedDateStr;
    const isSun = dateObj.getDay() === 0;
    const isSat = dateObj.getDay() === 6;
    const isHoliday = !!JapaneseHolidays.isHoliday(dateObj);
    
    let bgClass = isCurrentMonth ? "bg-white" : "bg-gray-50";
    if (isSelected) {
      bgClass = "bg-yellow-50 border-yellow-400 ring-2 ring-inset ring-yellow-400";
    }

    let textClass = "";
    if (isSelected) {
      textClass = "text-yellow-500";
    } else if (!isCurrentMonth) {
      if (isSun || isHoliday) textClass = "text-red-300";
      else if (isSat) textClass = "text-blue-300";
      else textClass = "text-gray-400";
    } else {
      if (isSun || isHoliday) textClass = "text-red-500";
      else if (isSat) textClass = "text-blue-500";
      else textClass = "text-gray-700";
    }
    
    html += `
      <div class="${bgClass} min-h-[50px] p-1 flex flex-col justify-start hover:bg-gray-100 transition-colors cursor-pointer relative" data-date="${dateStr}">
        <span class="text-xs font-semibold ${textClass}">${dateObj.getDate()}</span>
        <div class="mt-1 flex flex-col gap-0.5">
          ${summary.income > 0 ? `<div class="text-[10px] text-green-600 truncate text-right">+${summary.income.toLocaleString()}</div>` : '<div class="h-[15px]"></div>'}
          ${summary.expense > 0 ? `<div class="text-[10px] text-red-500 truncate text-right">-${summary.expense.toLocaleString()}</div>` : '<div class="h-[15px]"></div>'}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}
