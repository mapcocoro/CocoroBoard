// ストレージインターフェース
// 将来的にクラウドストレージに切り替えやすいよう抽象化

export interface Storage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

export interface EntityStorage<T> {
  getAll(): T[];
  getById(id: string): T | null;
  create(entity: T): T;
  update(id: string, entity: Partial<T>): T | null;
  delete(id: string): boolean;
}
