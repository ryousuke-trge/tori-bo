import { supabase } from './supabase';
import type { Category, Transaction, RecurringTask, TransactionWithCategory, RecurringTaskWithCategory } from './types';

export const api = {
  // --- キャッシュヘルパー ---
  getCachedCategories(): Category[] {
    try { return JSON.parse(localStorage.getItem('cache_categories') || '[]'); } catch { return []; }
  },
  getCachedTransactions(startDate: string, endDate: string): TransactionWithCategory[] {
    try {
      const all: TransactionWithCategory[] = JSON.parse(localStorage.getItem('cache_transactions') || '[]');
      return all.filter(t => t.date >= startDate && t.date <= endDate);
    } catch { return []; }
  },
  getCachedRecurringTasks(): RecurringTaskWithCategory[] {
    try { return JSON.parse(localStorage.getItem('cache_recurring') || '[]'); } catch { return []; }
  },

  // --- カテゴリ ---
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    localStorage.setItem('cache_categories', JSON.stringify(data));
    return data as Category[];
  },
  async addCategory(category: Omit<Category, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw error;
    return data as Category;
  },
  async updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'created_at'>>) {
    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Category;
  },
  async updateCategoryOrders(updates: { id: string; sort_order: number }[]) {
    // 複数件のupdateを実行
    const promises = updates.map(u => supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id));
    const results = await Promise.all(promises);
    for (const res of results) {
      if (res.error) throw res.error;
    }
  },
  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 取引 ---
  async getTransactions(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) throw error;

    // 取得した取引データをキャッシュに保存（既存データとマージ、またはこの範囲を置換）
    // 注意: シンプルな軽量アプリなので、最新の取得ブロックを保存するかマージします。
    // データが蓄積されるようにマージを実施します。
    try {
      const existing: TransactionWithCategory[] = JSON.parse(localStorage.getItem('cache_transactions') || '[]');
      const others = existing.filter(t => t.date < startDate || t.date > endDate);
      const merged = [...others, ...(data as TransactionWithCategory[])].sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem('cache_transactions', JSON.stringify(merged));
    } catch (e) {
      localStorage.setItem('cache_transactions', JSON.stringify(data));
    }

    return data as TransactionWithCategory[];
  },
  async addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('transactions').insert(tx).select().single();
    if (error) throw error;
    return data as Transaction;
  },
  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 定期タスク ---
  async getRecurringTasks() {
    const { data, error } = await supabase.from('recurring').select('*, categories(*)');
    if (error) throw error;
    localStorage.setItem('cache_recurring', JSON.stringify(data));
    return data as RecurringTaskWithCategory[];
  },
  async addRecurringTask(task: Omit<RecurringTask, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('recurring').insert(task).select().single();
    if (error) throw error;
    return data as RecurringTask;
  },
  async deleteRecurringTask(id: string) {
    const { error } = await supabase.from('recurring').delete().eq('id', id);
    if (error) throw error;
  }
};
