import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus } from '../types';
import { createEntityStorage } from '../services/localStorage';

const storage = createEntityStorage<Task>('task');

// タスク番号を生成（例: T2026-001）
function generateTaskNumber(tasks: Task[]): string {
  const year = new Date().getFullYear();
  const prefix = `T${year}-`;

  // 今年のタスク番号から最大値を取得
  const thisYearNumbers = tasks
    .filter(t => t.taskNumber?.startsWith(prefix))
    .map(t => {
      const num = parseInt(t.taskNumber!.replace(prefix, ''), 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNumber = thisYearNumbers.length > 0 ? Math.max(...thisYearNumbers) : 0;
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

  return `${prefix}${nextNumber}`;
}

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;

  // アクション
  loadTasks: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  selectTask: (id: string | null) => void;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  moveTask: (id: string, status: TaskStatus) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,

  loadTasks: () => {
    set({ isLoading: true });
    const tasks = storage.getAll();
    set({ tasks, isLoading: false });
  },

  addTask: (taskData) => {
    const now = new Date().toISOString();
    // taskNumberが渡されていればそれを使用、なければ自動生成
    const taskNumber = taskData.taskNumber || generateTaskNumber(get().tasks);
    const task: Task = {
      ...taskData,
      id: uuidv4(),
      taskNumber,
      createdAt: now,
      updatedAt: now,
    };
    storage.create(task);
    set({ tasks: [...get().tasks, task] });
    return task;
  },

  updateTask: (id, updates) => {
    const updated = storage.update(id, updates);
    if (updated) {
      set({
        tasks: get().tasks.map(t => (t.id === id ? updated : t)),
        selectedTask: get().selectedTask?.id === id ? updated : get().selectedTask,
      });
    }
  },

  deleteTask: (id) => {
    storage.delete(id);
    set({
      tasks: get().tasks.filter(t => t.id !== id),
      selectedTask: get().selectedTask?.id === id ? null : get().selectedTask,
    });
  },

  selectTask: (id) => {
    if (id === null) {
      set({ selectedTask: null });
    } else {
      const task = get().tasks.find(t => t.id === id) || null;
      set({ selectedTask: task });
    }
  },

  getTasksByProject: (projectId) => {
    return get().tasks.filter(t => t.projectId === projectId);
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter(t => t.status === status);
  },

  moveTask: (id, status) => {
    get().updateTask(id, { status });
  },
}));
