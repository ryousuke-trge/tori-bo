import { supabase } from './supabase';
import type { Category, Transaction, RecurringTask, TransactionWithCategory, RecurringTaskWithCategory, AssetEntry } from './types';

export const api = {
  // --- Cache Helpers ---
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

  // --- Categories ---
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
    // Execute multiple updates
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

  // --- Transactions ---
  async getTransactions(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) throw error;

    // Save fetched transaction data to cache (merge with existing data or replace this range)
    // Note: As a simple lightweight app, we save or merge the latest fetched block.
    // Merge to accumulate data.
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
  async addTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'author_email'>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const author_email = sessionData.session?.user?.email;

    const { data, error } = await supabase.from('transactions').insert({
      ...tx,
      author_email
    }).select().single();
    if (error) throw error;
    return data as Transaction;
  },
  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Transaction;
  },
  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Recurring Tasks ---
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
  },

  // --- Assets ---
  async getAssets() {
    const { data, error } = await supabase.from('assets').select('*').limit(1).maybeSingle();
    if (error) throw error;
    // 如果没有数据，返回默认的初始状态（理论上 SQL 已经插入了一条）
    if (!data) {
      return { id: '', bank: 0, cashless: 0, cash: 0 } as AssetEntry;
    }
    return data as AssetEntry;
  },
  async updateAssets(id: string, updates: Partial<Omit<AssetEntry, 'id' | 'updated_at'>>) {
    if (!id) {
       // idがない場合はinsertを試みる
       const { data, error } = await supabase.from('assets').insert(updates).select().single();
       if (error) throw error;
       return data as AssetEntry;
    }
    const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as AssetEntry;
  },

  // --- Auth utils ---
  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('cache_categories');
    localStorage.removeItem('cache_transactions');
    localStorage.removeItem('cache_recurring');
  }
};
