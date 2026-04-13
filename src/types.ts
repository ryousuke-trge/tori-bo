export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji
  type: 'income' | 'expense';
  sort_order?: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category_id: string;
  memo: string;
  author_email?: string;
  created_at?: string;
}

export interface TransactionWithCategory extends Transaction {
  categories: Category;
}

export interface RecurringTask {
  id: string;
  title: string;
  amount: number;
  category_id: string;
  day_of_month?: number; // Keep for migration
  start_date: string; // YYYY-MM-DD
  frequency: string; // 'daily', 'weekly', 'monthly', etc.
  created_at?: string;
}

export interface RecurringTaskWithCategory extends RecurringTask {
  categories: Category;
}

export interface AssetEntry {
  id: string;
  bank: number;
  cashless: number;
  cash: number;
  updated_at?: string;
}
