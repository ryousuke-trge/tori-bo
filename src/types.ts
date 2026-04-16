export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  sort_order?: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category_id: string;
  memo: string;
  author_name?: string;
  asset_type?: 'bank' | 'cashless' | 'cash';
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
  day_of_month?: number;
  start_date: string;
  frequency: string;
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
  author_name?: string;
  updated_at?: string;
}

export interface Profile {
  email: string;
  display_name: string;
}
