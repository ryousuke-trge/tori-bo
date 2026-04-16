export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

export function getMonthNames(): string[] {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

export function getCalendarGrid(year: number, month: number): Date[] {
  const grid: Date[] = [];

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const startDay = startOfMonth.getDay();

  for (let i = startDay - 1; i >= 0; i--) {
    grid.push(new Date(year, month, -i));
  }

  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    grid.push(new Date(year, month, i));
  }

  const remainingCells = 42 - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    grid.push(new Date(year, month + 1, i));
  }

  return grid;
}
