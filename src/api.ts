import { supabase } from './supabase';
import type { Category, Transaction, RecurringTask, TransactionWithCategory, RecurringTaskWithCategory, AssetEntry, Profile } from './types';

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
  getCachedProfiles(): Profile[] {
    try { return JSON.parse(localStorage.getItem('cache_profiles') || '[]'); } catch { return []; }
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
  async addTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'author_name'>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const author_name = sessionData.session?.user?.email;

    const { data, error } = await supabase.from('transactions').insert({
      ...tx,
      author_name
    }).select().single();
    if (error) throw error;

    // Update Asset
    if (tx.asset_type) {
      const category = this.getCachedCategories().find(c => c.id === tx.category_id);
      if (category) {
        let assets = await this.getAssets();
        const key = tx.asset_type as 'bank' | 'cashless' | 'cash';
        const currentAmount = assets[key] || 0;
        const diff = category.type === 'income' ? tx.amount : -tx.amount;
        
        await this.updateAssets(assets.id, {
          [key]: currentAmount + diff
        });
      }
    }

    return data as Transaction;
  },
  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) {
    const { data: oldTx, error: fetchError } = await supabase.from('transactions').select('*, categories(*)').eq('id', id).single();
    if (fetchError) throw fetchError;

    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Update assets based on difference
    let assets = await this.getAssets();
    let oldCatType = oldTx.categories?.type || this.getCachedCategories().find(c => c.id === oldTx.category_id)?.type;
    let newAssetType = updates.asset_type !== undefined ? updates.asset_type : oldTx.asset_type;
    let newCatId = updates.category_id || oldTx.category_id;
    let newAmount = updates.amount !== undefined ? updates.amount : oldTx.amount;
    let newCategory = this.getCachedCategories().find(c => c.id === newCatId);
    let newCatType = newCategory ? newCategory.type : null;

    let assetUpdates: Partial<AssetEntry> = {};

    if (oldTx.asset_type && oldCatType) {
        const removeDiff = oldCatType === 'income' ? -oldTx.amount : oldTx.amount;
        const key = oldTx.asset_type as 'bank' | 'cashless' | 'cash';
        assetUpdates[key] = (assets[key] || 0) + removeDiff;
    }

    if (newAssetType && newCatType) {
        const addDiff = newCatType === 'income' ? newAmount : -newAmount;
        const key = newAssetType as 'bank' | 'cashless' | 'cash';
        if (assetUpdates[key] !== undefined) {
            assetUpdates[key] = (assetUpdates[key] as number) + addDiff;
        } else {
            assetUpdates[key] = (assets[key] || 0) + addDiff;
        }
    }

    if (Object.keys(assetUpdates).length > 0) {
        await this.updateAssets(assets.id, assetUpdates);
    }

    return data as Transaction;
  },
  async deleteTransaction(id: string) {
    const { data: oldTx, error: fetchError } = await supabase.from('transactions').select('*, categories(*)').eq('id', id).maybeSingle();
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;

    if (oldTx && !fetchError && oldTx.asset_type) {
        const oldCatType = oldTx.categories?.type || this.getCachedCategories().find(c => c.id === oldTx.category_id)?.type;
        if (oldCatType) {
            let assets = await this.getAssets();
            const key = oldTx.asset_type as 'bank' | 'cashless' | 'cash';
            const diff = oldCatType === 'income' ? -oldTx.amount : oldTx.amount;
            await this.updateAssets(assets.id, {
                [key]: (assets[key] || 0) + diff
            });
        }
    }
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
    const { data: sessionData } = await supabase.auth.getSession();
    const author_name = sessionData.session?.user?.email;

    const { data, error } = await supabase.from('assets')
      .select('*')
      .eq('author_name', author_name)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    // 如果没有数据，返回默认的初始状态（理论上 SQL 已经插入了一条）
    if (!data) {
      return { id: '', bank: 0, cashless: 0, cash: 0, author_name } as AssetEntry;
    }
    return data as AssetEntry;
  },
  async updateAssets(id: string, updates: Partial<Omit<AssetEntry, 'id' | 'updated_at'>>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const author_name = sessionData.session?.user?.email;

    if (!id) {
       // idがない場合はinsertを試みる
       const { data, error } = await supabase.from('assets').insert({ ...updates, author_name }).select().single();
       if (error) throw error;
       return data as AssetEntry;
    }
    const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as AssetEntry;
  },

  // --- Profiles ---
  async getProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    localStorage.setItem('cache_profiles', JSON.stringify(data));
    return data as Profile[];
  },
  async upsertProfile(email: string, display_name: string) {
    const { data, error } = await supabase.from('profiles').upsert({ email, display_name }, { onConflict: 'email' }).select().single();
    if (error) throw error;
    return data as Profile;
  },

  // --- Auth utils ---
  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('cache_categories');
    localStorage.removeItem('cache_transactions');
    localStorage.removeItem('cache_recurring');
    localStorage.removeItem('cache_profiles');
  }
};
