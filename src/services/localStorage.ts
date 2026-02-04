import type { Storage, EntityStorage } from './storage';

// LocalStorage実装
class LocalStorageImpl implements Storage {
  private prefix = 'cocoroboard_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const storage = new LocalStorageImpl();

// エンティティストレージのファクトリ
export function createEntityStorage<T extends { id: string }>(entityName: string): EntityStorage<T> {
  const key = `${entityName}s`;

  return {
    getAll(): T[] {
      return storage.get<T[]>(key) || [];
    },

    getById(id: string): T | null {
      const items = this.getAll();
      return items.find(item => item.id === id) || null;
    },

    create(entity: T): T {
      const items = this.getAll();
      items.push(entity);
      storage.set(key, items);
      return entity;
    },

    update(id: string, updates: Partial<T>): T | null {
      const items = this.getAll();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;

      const updated = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      items[index] = updated as T;
      storage.set(key, items);
      return updated as T;
    },

    delete(id: string): boolean {
      const items = this.getAll();
      const filtered = items.filter(item => item.id !== id);
      if (filtered.length === items.length) return false;

      storage.set(key, filtered);
      return true;
    },
  };
}
