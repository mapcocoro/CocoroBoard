import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectType } from '../types';
import { createEntityStorage } from '../services/localStorage';

const storage = createEntityStorage<Project>('project');

// 案件番号を生成（種別によってプレフィックスが変わる）
// - client（受託案件）: YY-NN 形式（例: 26-01）
// - internal（自社プロダクト）: Pro-NNN 形式（例: Pro-001）
// - demo（デモ・サンプル）: Demo-NNN 形式（例: Demo-001）
function generateProjectNumber(projects: Project[], type: ProjectType = 'client'): string {
  const year = new Date().getFullYear();
  const shortYear = year.toString().slice(-2); // 26 for 2026

  let prefix: string;
  let padLength: number;

  switch (type) {
    case 'internal':
      prefix = 'Pro-';
      padLength = 3;
      break;
    case 'demo':
      prefix = 'Demo-';
      padLength = 3;
      break;
    case 'client':
    default:
      prefix = `${shortYear}-`;
      padLength = 2;
      break;
  }

  // 同じプレフィックスの案件番号から最大値を取得
  const matchingNumbers = projects
    .filter(p => p.projectNumber?.startsWith(prefix))
    .map(p => {
      const num = parseInt(p.projectNumber!.replace(prefix, ''), 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNumber = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0;
  const nextNumber = (maxNumber + 1).toString().padStart(padLength, '0');

  return `${prefix}${nextNumber}`;
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;

  // アクション
  loadProjects: () => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  getProjectsByCustomer: (customerId: string) => Project[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,

  loadProjects: () => {
    set({ isLoading: true });
    const projects = storage.getAll();
    set({ projects, isLoading: false });
  },

  addProject: (projectData) => {
    const now = new Date().toISOString();
    // projectNumberが渡されていればそれを使用、なければ種別に応じて自動生成
    const projectNumber = projectData.projectNumber || generateProjectNumber(get().projects, projectData.type);
    const project: Project = {
      ...projectData,
      id: uuidv4(),
      projectNumber,
      createdAt: now,
      updatedAt: now,
    };
    storage.create(project);
    set({ projects: [...get().projects, project] });
    return project;
  },

  updateProject: (id, updates) => {
    const updated = storage.update(id, updates);
    if (updated) {
      set({
        projects: get().projects.map(p => (p.id === id ? updated : p)),
        selectedProject: get().selectedProject?.id === id ? updated : get().selectedProject,
      });
    }
  },

  deleteProject: (id) => {
    storage.delete(id);
    set({
      projects: get().projects.filter(p => p.id !== id),
      selectedProject: get().selectedProject?.id === id ? null : get().selectedProject,
    });
  },

  selectProject: (id) => {
    if (id === null) {
      set({ selectedProject: null });
    } else {
      const project = get().projects.find(p => p.id === id) || null;
      set({ selectedProject: project });
    }
  },

  getProjectsByCustomer: (customerId) => {
    return get().projects.filter(p => p.customerId === customerId);
  },
}));
