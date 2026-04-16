import { api } from './api';

const INITIAL_CATEGORIES = [
  { name: '給与', icon: '💰', type: 'income' },
  { name: 'お小遣い', icon: '🎁', type: 'income' },
  { name: '食費', icon: '🍔', type: 'expense' },
  { name: '日用品', icon: '🧻', type: 'expense' },
  { name: '旅費交通費', icon: '🚆', type: 'expense' },
  { name: '健康', icon: '💊', type: 'expense' },
  { name: '美容', icon: '✂️', type: 'expense' },
  { name: '衣服', icon: '👕', type: 'expense' },
  { name: '娯楽', icon: '🎮', type: 'expense' },
  { name: '交際費', icon: '🍻', type: 'expense' },
  { name: 'イベント', icon: '🎉', type: 'expense' },
  { name: 'クレカ', icon: '💳', type: 'expense' },
  { name: '保険料', icon: '📄', type: 'expense' },
  { name: '携帯代', icon: '📱', type: 'expense' },
  { name: '奨学金', icon: '🎓', type: 'expense' },
  { name: '住宅', icon: '🏠', type: 'expense' },
  { name: '住民税', icon: '🏛️', type: 'expense' },
  { name: '就労支援利用料', icon: '💼', type: 'expense' },
  { name: 'その他', icon: '📦', type: 'expense' },
] as const;

export async function initCategoriesIfEmpty() {
  try {

    const categories = await api.getCategories();

    if (categories.length === 0) {
      console.log('Inserting initial categories...');

      for (const cat of INITIAL_CATEGORIES) {

        await api.addCategory({
          name: cat.name,
          icon: cat.icon,
          type: cat.type
        });
      }
      console.log('Initial categories setup completed.');
    }
  } catch (error) {
    console.error('Failed to initialize categories:', error);
  }
}
