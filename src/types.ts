export interface Category {
  id: string;
  name: string;
  icon: string; // 絵文字
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
  day_of_month: number; // 31の場合は月末扱いとするなどのルールを適用
  created_at?: string;
}

export interface RecurringTaskWithCategory extends RecurringTask {
  categories: Category;
}
