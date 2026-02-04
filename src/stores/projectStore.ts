import { create } from 'zustand';
import type { Project, ProjectType, Activity } from '../types';
import { supabase } from '../services/supabase';

// 案件番号を生成
function generateProjectNumber(projects: Project[], type: ProjectType = 'client'): string {
  const year = new Date().getFullYear();
  const shortYear = year.toString().slice(-2);

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

// DB→アプリ型変換
const fromDb = (row: Record<string, unknown>): Project => ({
  id: row.id as string,
  projectNumber: row.project_number as string | undefined,
  customerId: row.customer_id as string,
  name: row.name as string,
  description: row.description as string | undefined,
  type: (row.type as ProjectType) || 'client',
  category: row.category as Project['category'],
  status: row.status as Project['status'],
  startDate: row.start_date as string | undefined,
  dueDate: row.due_date as string | undefined,
  budget: row.budget as number | undefined,
  domainInfo: row.domain_info as string | undefined,
  aiConsultUrl: row.ai_consult_url as string | undefined,
  codeFolder: row.code_folder as string | undefined,
  meetingFolder: row.meeting_folder as string | undefined,
  contractFolder: row.contract_folder as string | undefined,
  stagingUrl: row.staging_url as string | undefined,
  productionUrl: row.production_url as string | undefined,
  activities: (row.activities as Activity[]) || [],
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// アプリ→DB型変換
const toDb = (project: Partial<Project>) => ({
  ...(project.projectNumber !== undefined && { project_number: project.projectNumber || null }),
  ...(project.customerId !== undefined && { customer_id: project.customerId }),
  ...(project.name !== undefined && { name: project.name }),
  ...(project.description !== undefined && { description: project.description || null }),
  ...(project.type !== undefined && { type: project.type }),
  ...(project.category !== undefined && { category: project.category || null }),
  ...(project.status !== undefined && { status: project.status }),
  ...(project.startDate !== undefined && { start_date: project.startDate || null }),
  ...(project.dueDate !== undefined && { due_date: project.dueDate || null }),
  ...(project.budget !== undefined && { budget: project.budget || null }),
  ...(project.domainInfo !== undefined && { domain_info: project.domainInfo || null }),
  ...(project.aiConsultUrl !== undefined && { ai_consult_url: project.aiConsultUrl || null }),
  ...(project.codeFolder !== undefined && { code_folder: project.codeFolder || null }),
  ...(project.meetingFolder !== undefined && { meeting_folder: project.meetingFolder || null }),
  ...(project.contractFolder !== undefined && { contract_folder: project.contractFolder || null }),
  ...(project.stagingUrl !== undefined && { staging_url: project.stagingUrl || null }),
  ...(project.productionUrl !== undefined && { production_url: project.productionUrl || null }),
  ...(project.activities !== undefined && { activities: project.activities }),
});

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;

  loadProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  getProjectsByCustomer: (customerId: string) => Project[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load projects:', error);
      set({ isLoading: false });
      return;
    }

    const projects = (data || []).map(fromDb);
    set({ projects, isLoading: false });
  },

  addProject: async (projectData) => {
    const projectNumber = projectData.projectNumber || generateProjectNumber(get().projects, projectData.type);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...toDb(projectData as Partial<Project>),
        project_number: projectNumber,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add project:', error);
      throw error;
    }

    const project = fromDb(data);
    set({ projects: [project, ...get().projects] });
    return project;
  },

  updateProject: async (id, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...toDb(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update project:', error);
      return;
    }

    const updated = fromDb(data);
    set({
      projects: get().projects.map(p => (p.id === id ? updated : p)),
      selectedProject: get().selectedProject?.id === id ? updated : get().selectedProject,
    });
  },

  deleteProject: async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete project:', error);
      return;
    }

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
