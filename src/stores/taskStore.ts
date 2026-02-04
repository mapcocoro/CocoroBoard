import { create } from 'zustand';
import type { Task, TaskStatus } from '../types';
import { supabase } from '../services/supabase';

// タスク番号を生成
function generateTaskNumber(tasks: Task[]): string {
  const year = new Date().getFullYear();
  const prefix = `T${year}-`;

  const matchingNumbers = tasks
    .filter(t => t.taskNumber?.startsWith(prefix))
    .map(t => {
      const num = parseInt(t.taskNumber!.replace(prefix, ''), 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNumber = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0;
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

  return `${prefix}${nextNumber}`;
}

// DB→アプリ型変換
const fromDb = (row: Record<string, unknown>): Task => ({
  id: row.id as string,
  taskNumber: row.task_number as string | undefined,
  projectId: row.project_id as string,
  name: row.name as string,
  description: row.description as string | undefined,
  status: row.status as Task['status'],
  priority: row.priority as Task['priority'],
  dueDate: row.due_date as string | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// アプリ→DB型変換
const toDb = (task: Partial<Task>) => ({
  ...(task.taskNumber !== undefined && { task_number: task.taskNumber || null }),
  ...(task.projectId !== undefined && { project_id: task.projectId }),
  ...(task.name !== undefined && { name: task.name }),
  ...(task.description !== undefined && { description: task.description || null }),
  ...(task.status !== undefined && { status: task.status }),
  ...(task.priority !== undefined && { priority: task.priority }),
  ...(task.dueDate !== undefined && { due_date: task.dueDate || null }),
});

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  selectTask: (id: string | null) => void;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load tasks:', error);
      set({ isLoading: false });
      return;
    }

    const tasks = (data || []).map(fromDb);
    set({ tasks, isLoading: false });
  },

  addTask: async (taskData) => {
    const taskNumber = taskData.taskNumber || generateTaskNumber(get().tasks);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...toDb(taskData as Partial<Task>),
        task_number: taskNumber,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add task:', error);
      throw error;
    }

    const task = fromDb(data);
    set({ tasks: [task, ...get().tasks] });
    return task;
  },

  updateTask: async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...toDb(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update task:', error);
      return;
    }

    const updated = fromDb(data);
    set({
      tasks: get().tasks.map(t => (t.id === id ? updated : t)),
      selectedTask: get().selectedTask?.id === id ? updated : get().selectedTask,
    });
  },

  deleteTask: async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete task:', error);
      return;
    }

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

  moveTask: async (id, status) => {
    await get().updateTask(id, { status });
  },
}));
