import { supabase } from './supabase';

import type { Category, Transaction, RecurringTask, TransactionWithCategory, RecurringTaskWithCategory, AssetEntry, Profile } from './types';

export const api = {

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
  async getCurrentUserEmail(): Promise<string | undefined> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.email;
  },

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

  async getTransactions(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) throw error;

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
    const { data: sessionData } = await supabase.auth.getSession();
    const author_name = tx.author_name || sessionData.session?.user?.email;

    const { data, error } = await supabase.from('transactions').insert({
      ...tx,
      asset_type: tx.asset_type || 'cash',
      author_name
    }).select().single();
    if (error) throw error;

    const assetType = tx.asset_type || 'cash';
    const category = this.getCachedCategories().find(c => c.id === tx.category_id);
    if (category) {
      let assets = await this.getAssets(author_name);
      const key = assetType as 'bank' | 'cashless' | 'cash';
      const currentAmount = assets[key] || 0;
      const diff = category.type === 'income' ? tx.amount : -tx.amount;

      await this.updateAssets(assets.id, {
        [key]: currentAmount + diff,
        author_name
      });
    }

    return data as Transaction;
  },
  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) {
    const { data: oldTx, error: fetchError } = await supabase.from('transactions').select('*, categories(*)').eq('id', id).single();
    if (fetchError) throw fetchError;

    const payload = { ...updates };
    if (!payload.asset_type) {
      payload.asset_type = oldTx.asset_type || 'cash';
    }

    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select().single();
    if (error) throw error;

    const currentUser = await this.getCurrentUserEmail();
    let oldAuthor = oldTx.author_name || currentUser;
    let newAuthor = payload.author_name !== undefined ? payload.author_name : oldAuthor;

    let oldCatType = oldTx.categories?.type || this.getCachedCategories().find(c => c.id === oldTx.category_id)?.type;
    let oldAssetType = oldTx.asset_type || 'cash';
    let newAssetType = payload.asset_type;
    let newCatId = updates.category_id || oldTx.category_id;
    let newAmount = updates.amount !== undefined ? updates.amount : oldTx.amount;
    let newCategory = this.getCachedCategories().find(c => c.id === newCatId);
    let newCatType = newCategory ? newCategory.type : null;

    if (oldAuthor === newAuthor) {
      let assets = await this.getAssets(oldAuthor);
      let assetUpdates: Partial<AssetEntry> = {};

      if (oldCatType) {
          const removeDiff = oldCatType === 'income' ? -oldTx.amount : oldTx.amount;
          const key = oldAssetType as 'bank' | 'cashless' | 'cash';
          assetUpdates[key] = (assets[key] || 0) + removeDiff;
      }

      if (newCatType) {
          const addDiff = newCatType === 'income' ? newAmount : -newAmount;
          const key = newAssetType as 'bank' | 'cashless' | 'cash';
          if (assetUpdates[key] !== undefined) {
              assetUpdates[key] = (assetUpdates[key] as number) + addDiff;
          } else {
              assetUpdates[key] = (assets[key] || 0) + addDiff;
          }
      }

      if (Object.keys(assetUpdates).length > 0) {
          assetUpdates.author_name = oldAuthor;
          await this.updateAssets(assets.id, assetUpdates);
      }
    } else {
      if (oldCatType) {
          let oldAssets = await this.getAssets(oldAuthor);
          const removeDiff = oldCatType === 'income' ? -oldTx.amount : oldTx.amount;
          const key = oldAssetType as 'bank' | 'cashless' | 'cash';
          await this.updateAssets(oldAssets.id, {
             [key]: (oldAssets[key] || 0) + removeDiff,
             author_name: oldAuthor
          });
      }
      if (newCatType) {
          let newAssets = await this.getAssets(newAuthor);
          const addDiff = newCatType === 'income' ? newAmount : -newAmount;
          const key = newAssetType as 'bank' | 'cashless' | 'cash';
          await this.updateAssets(newAssets.id, {
             [key]: (newAssets[key] || 0) + addDiff,
             author_name: newAuthor
          });
      }
    }

    return data as Transaction;
  },
  async deleteTransaction(id: string) {
    const { data: oldTx, error: fetchError } = await supabase.from('transactions').select('*, categories(*)').eq('id', id).maybeSingle();

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;

    if (oldTx && !fetchError) {
        const oldCatType = oldTx.categories?.type || this.getCachedCategories().find(c => c.id === oldTx.category_id)?.type;
        const oldAssetType = oldTx.asset_type || 'cash';
        if (oldCatType) {
            const currentUser = await this.getCurrentUserEmail();
            const txAuthor = oldTx.author_name || currentUser;
            let assets = await this.getAssets(txAuthor);
            const key = oldAssetType as 'bank' | 'cashless' | 'cash';
            const diff = oldCatType === 'income' ? -oldTx.amount : oldTx.amount;
            await this.updateAssets(assets.id, {
                [key]: (assets[key] || 0) + diff,
                author_name: txAuthor
            });
        }
    }
  },

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

  async getAllAssets() {
    const { data, error } = await supabase.from('assets').select('*');
    if (error) throw error;
    return data as AssetEntry[];
  },

  async getAssets(authorEmail?: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const author_name = authorEmail || sessionData.session?.user?.email;

    const { data, error } = await supabase.from('assets')
      .select('*')
      .eq('author_name', author_name)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { id: '', bank: 0, cashless: 0, cash: 0, author_name } as AssetEntry;
    }
    return data as AssetEntry;
  },
  async updateAssets(id: string, updates: Partial<Omit<AssetEntry, 'id' | 'updated_at'>>) {
    if (!id) {
       let finalAuthorName = (updates as any).author_name;
       if (!finalAuthorName) {
           const { data: sessionData } = await supabase.auth.getSession();
           finalAuthorName = sessionData.session?.user?.email;
       }
       const { data, error } = await supabase.from('assets').insert({ ...updates, author_name: finalAuthorName }).select().single();
       if (error) throw error;
       return data as AssetEntry;
    }
    const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as AssetEntry;
  },

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

  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('cache_categories');
    localStorage.removeItem('cache_transactions');
    localStorage.removeItem('cache_recurring');
    localStorage.removeItem('cache_profiles');
  }
};
