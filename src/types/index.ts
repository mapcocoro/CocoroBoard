// 共通のID型
export type ID = string;

// 顧客
export interface Customer {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  position?: string;
  contactPerson?: string;
  category?: string;
  referralSource?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// 案件ステータス
export type ProjectStatus = 'consulting' | 'estimating' | 'in_progress' | 'waiting_review' | 'completed' | 'maintenance' | 'lost';

// 活動種別
export type ActivityType = 'meeting' | 'call' | 'email' | 'other';

// 活動ログ
export interface Activity {
  id: ID;
  date: string;
  type: ActivityType;
  content: string;
  completed?: boolean;  // 完了フラグ（未完了=false/undefined、完了=true）
  createdAt: string;
}

// 案件種別
export type ProjectType = 'client' | 'internal' | 'demo';

// 案件カテゴリ
export type ProjectCategory = 'hp' | 'lp' | 'line_official' | 'line_mini' | 'app' | 'other';

// 案件
export interface Project {
  id: ID;
  projectNumber?: string;  // 案件ID（例: 2026-001）
  customerId: ID;
  name: string;
  description?: string;
  type: ProjectType;
  category?: ProjectCategory;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  budget?: number;
  // 追加フィールド
  domainInfo?: string;
  aiConsultUrl?: string;
  codeFolder?: string;
  meetingFolder?: string;
  contractFolder?: string;
  stagingUrl?: string;
  productionUrl?: string;
  activities?: Activity[];  // 活動ログ
  createdAt: string;
  updatedAt: string;
}

// タスクステータス
export type TaskStatus = 'todo' | 'in_progress' | 'done';

// タスク優先度
export type TaskPriority = 'low' | 'medium' | 'high';

// タスク
export interface Task {
  id: ID;
  taskNumber?: string;  // タスクID（例: T2026-001）
  projectId: ID;
  customerId?: ID;      // 顧客ID（直接紐付け）
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  // 追加フィールド
  domainInfo?: string;       // ドメインメモ（ID/PW等）
  aiConsultUrl?: string;     // AI相談URL
  codeFolder?: string;       // コードフォルダ
  meetingFolder?: string;    // 打合せフォルダ
  contractFolder?: string;   // 契約書フォルダ
  stagingUrl?: string;       // 検証URL
  productionUrl?: string;    // 公開URL
  activities?: Activity[];  // 活動ログ
  createdAt: string;
  updatedAt: string;
}

// 請求ステータス
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// 請求
export interface Invoice {
  id: ID;
  customerId: ID;
  projectId?: ID;
  taskId?: ID;           // タスクID（紐付け）
  invoiceNumber: string;
  estimateAmount?: number;  // 見積金額（税抜）
  amount: number;           // 請求金額（税抜）
  tax?: number;             // 消費税
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  status: InvoiceStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// ステータスラベルの日本語マッピング
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  client: '受託案件',
  internal: '自社プロダクト',
  demo: 'デモ・サンプル',
};

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  hp: 'HP',
  lp: 'LP',
  line_official: 'LINE公式',
  line_mini: 'LINEミニ',
  app: 'アプリ',
  other: 'その他',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  consulting: '相談中',
  estimating: '見積中',
  in_progress: '制作中',
  waiting_review: '確認待ち',
  completed: '完了',
  maintenance: '保守中',
  lost: '失注',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  meeting: '打合せ',
  call: '電話',
  email: 'メール',
  other: 'その他',
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  meeting: '🤝',
  call: '📞',
  email: '📧',
  other: '📝',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  done: '完了',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: '下書き',
  sent: '送付済',
  paid: '入金済',
  overdue: '期限超過',
  cancelled: 'キャンセル',
};
