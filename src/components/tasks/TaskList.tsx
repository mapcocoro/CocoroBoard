import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Badge, EmptyState, ConfirmDialog, Card, CardBody, useViewMode } from '../common';
import { TaskForm } from './TaskForm';
import { useTaskStore, useProjectStore, useCustomerStore } from '../../stores';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from '../../types';
import type { Task, TaskStatus, Activity } from '../../types';
import { format } from 'date-fns';

export function TaskList() {
  const navigate = useNavigate();
  const { tasks, addTask, updateTask, deleteTask, toggleActivityCompleted } = useTaskStore();
  const { projects, addProject } = useProjectStore();
  const { customers } = useCustomerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useViewMode('tasks', 'list');
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'category' | 'status' | 'priority' | 'dueDate'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ソートヘッダークリック
  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // 自社系カテゴリかどうかを判定
  const isSelfCategory = (name: string) => {
    const selfPatterns = ['自社', 'demo/', 'Demo/', 'Pro/', 'その他/', '未分類'];
    return selfPatterns.some(pattern => name.includes(pattern) || name.toLowerCase().startsWith(pattern.toLowerCase()));
  };

  // 自社カテゴリと顧客を分離
  const selfCategories = customers.filter(c => isSelfCategory(c.name));
  const realCustomers = customers.filter(c => !isSelfCategory(c.name) && c.name !== '自社開発');

  // 顧客IDからprojectIdを取得（なければ作成）
  const getOrCreateProjectForCustomer = async (customerId?: string): Promise<string> => {
    // 顧客なし → 「自社開発タスク」
    if (!customerId) {
      const selfProject = projects.find(p => p.name === '自社開発タスク');
      if (selfProject) return selfProject.id;
      // なければ作成
      const selfCustomer = customers.find(c => c.name === '自社開発');
      if (selfCustomer) {
        const newProject = await addProject({
          customerId: selfCustomer.id,
          name: '自社開発タスク',
          type: 'internal',
          status: 'in_progress',
        });
        return newProject.id;
      }
      // 自社開発顧客もなければ最初のプロジェクトを使用
      return projects[0]?.id || '';
    }

    // 顧客あり → その顧客の「開発タスク」案件を探す
    const customerProject = projects.find(
      p => p.customerId === customerId && p.name.includes('タスク')
    ) || projects.find(p => p.customerId === customerId);

    if (customerProject) return customerProject.id;

    // なければ作成
    const customer = customers.find(c => c.id === customerId);
    const newProject = await addProject({
      customerId,
      name: `${customer?.name || ''}タスク`,
      type: 'client',
      status: 'in_progress',
    });
    return newProject.id;
  };

  const handleCreate = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, customerId?: string) => {
    const projectId = await getOrCreateProjectForCustomer(customerId);
    // 顧客タスクかどうか判定（自社カテゴリでなければ顧客タスク）
    const isCustomerTask = customerId
      ? !isSelfCategory(customers.find(c => c.id === customerId)?.name || '')
      : false;
    await addTask({ ...data, projectId }, isCustomerTask);
    setIsModalOpen(false);
  };

  const handleUpdate = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, customerId?: string) => {
    if (editTarget) {
      const projectId = await getOrCreateProjectForCustomer(customerId);
      await updateTask(editTarget.id, { ...data, projectId });
      setEditTarget(null);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteTask(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // 顧客IDを取得
  const getCustomerId = (task: Task) => {
    const project = projects.find(p => p.id === task.projectId);
    if (!project || project.name === '自社開発タスク') return null;
    return project.customerId;
  };

  // 顧客名を取得
  const getCustomerName = (task: Task) => {
    const customerId = getCustomerId(task);
    if (!customerId) return null;
    return customers.find(c => c.id === customerId)?.name;
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in_progress':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  // ステータスでフィルタ
  const statusFilteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  // カテゴリでフィルタ
  const filteredTasks = filterCategory === 'all'
    ? statusFilteredTasks
    : filterCategory === 'customers'
      ? statusFilteredTasks.filter((t) => {
          const customerId = getCustomerId(t);
          if (!customerId) return false;
          const customer = customers.find(c => c.id === customerId);
          return customer && !isSelfCategory(customer.name);
        })
      : filterCategory === 'internal'
        ? statusFilteredTasks.filter((t) => {
            const customerId = getCustomerId(t);
            if (!customerId) return true; // 自社開発タスク
            const customer = customers.find(c => c.id === customerId);
            return customer && isSelfCategory(customer.name);
          })
        : statusFilteredTasks.filter((t) => {
            const customerId = getCustomerId(t);
            return customerId === filterCategory;
          });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const statusOrder: Record<string, number> = { todo: 0, in_progress: 1, done: 2 };
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    switch (sortKey) {
      case 'id':
        return multiplier * (a.taskNumber || '').localeCompare(b.taskNumber || '');
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'category': {
        const catA = getCustomerName(a) || '';
        const catB = getCustomerName(b) || '';
        return multiplier * catA.localeCompare(catB);
      }
      case 'status':
        return multiplier * (statusOrder[a.status] - statusOrder[b.status]);
      case 'priority':
        return multiplier * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'dueDate': {
        const dateA = a.dueDate || '9999-12-31';
        const dateB = b.dueDate || '9999-12-31';
        return multiplier * dateA.localeCompare(dateB);
      }
      default:
        return 0;
    }
  });

  // ネクストアクション（タスクの未完了活動を収集）
  interface NextAction {
    activity: Activity;
    taskId: string;
    taskName: string;
    customerName?: string;
  }

  const nextActions: NextAction[] = [];

  tasks.forEach((task) => {
    const customerName = getCustomerName(task);

    (task.activities || []).forEach((activity) => {
      if (!activity.completed) {
        nextActions.push({
          activity,
          taskId: task.id,
          taskName: task.name,
          customerName: customerName || undefined,
        });
      }
    });
  });

  // 日付順にソート
  const sortedNextActions = nextActions
    .sort((a, b) => new Date(a.activity.date).getTime() - new Date(b.activity.date).getTime());

  return (
    <div className="h-full flex flex-col">
      <Header
        title="タスク"
        action={
          <Button onClick={() => setIsModalOpen(true)}>+ 新規タスク</Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* ネクストアクション */}
        {sortedNextActions.length > 0 && (
          <Card className="mb-4">
            <CardBody>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <span>📅</span>
                ネクストアクション
              </h3>
              <div className="space-y-2">
                {sortedNextActions.map((item) => (
                  <div
                    key={`${item.taskId}-${item.activity.id}`}
                    className="flex items-center gap-3 p-2 rounded-md bg-blue-50 border border-blue-100"
                  >
                    <button
                      onClick={async () => {
                        await toggleActivityCompleted(item.taskId, item.activity.id);
                      }}
                      className="text-lg flex-shrink-0 hover:scale-110 transition-transform"
                      title="完了にする"
                    >
                      ☐
                    </button>
                    <span className="text-base flex-shrink-0">{ACTIVITY_TYPE_ICONS[item.activity.type]}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600">
                        {format(new Date(item.activity.date), 'M/d')}
                      </span>
                      <Badge variant="default">{ACTIVITY_TYPE_LABELS[item.activity.type]}</Badge>
                      <span className="text-sm text-[var(--color-text)] truncate">
                        {item.activity.content}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
                        - {item.customerName && `${item.customerName}/`}{item.taskName}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/tasks/${item.taskId}`)}
                      className="text-xs text-[var(--color-primary)] hover:underline flex-shrink-0"
                    >
                      詳細
                    </button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* フィルター & ビュー切り替え */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterStatus === status
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'すべて' : TASK_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-md bg-white"
            >
              <option value="all">全カテゴリ</option>
              <option value="customers">顧客のみ</option>
              <option value="internal">自社カテゴリのみ</option>
              <optgroup label="── 顧客 ──">
                {realCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="── 自社カテゴリ ──">
                {selfCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="flex border border-[var(--color-border)] rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('card')}
              className={`px-2 py-1.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white text-[var(--color-text-muted)] hover:bg-gray-50'
              }`}
              title="カード表示"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white text-[var(--color-text-muted)] hover:bg-gray-50'
              }`}
              title="リスト表示"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {sortedTasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title="タスクがありません"
            description={filterStatus === 'all' ? '最初のタスクを追加しましょう' : 'このステータスのタスクはありません'}
            action={filterStatus === 'all' ? <Button onClick={() => setIsModalOpen(true)}>+ 新規タスク</Button> : undefined}
          />
        ) : viewMode === 'card' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedTasks.map((task) => {
              const customerName = getCustomerName(task);
              return (
                <Card key={task.id}>
                  <CardBody>
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className="font-medium text-[var(--color-primary)] hover:underline truncate text-left block w-full"
                        >
                          {task.taskNumber && (
                            <span className="text-[var(--color-text-muted)] font-normal mr-2">{task.taskNumber}</span>
                          )}
                          {task.name}
                        </button>
                        {customerName && (
                          <p className="text-xs text-[var(--color-primary)] mt-1">
                            {customerName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditTarget(task)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteTarget(task)}
                          className="text-[var(--color-text-muted)] hover:text-red-500 p-1"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {format(new Date(task.dueDate), 'MM/dd')}
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-hover)]">
                  {([
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'タスク名' },
                    { key: 'category', label: 'カテゴリ' },
                    { key: 'status', label: 'ステータス' },
                    { key: 'priority', label: '優先度' },
                    { key: 'dueDate', label: '期限' },
                  ] as const).map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {sortKey === key && (
                          <span className="text-[var(--color-primary)]">
                            {sortOrder === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => {
                  const customerName = getCustomerName(task);
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)]"
                    >
                      <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        {task.taskNumber || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className="font-medium text-sm text-[var(--color-primary)] hover:underline text-left"
                        >
                          {task.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {customerName ? (
                          <span className="text-[var(--color-primary)]">{customerName}</span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        {task.dueDate ? format(new Date(task.dueDate), 'yyyy/MM/dd') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditTarget(task)}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteTarget(task)}
                            className="text-[var(--color-text-muted)] hover:text-red-500"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新規タスク"
      >
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="タスクを編集"
      >
        {editTarget && (
          <TaskForm
            task={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="タスクを削除"
        message={`「${deleteTarget?.name}」を削除しますか？`}
        confirmLabel="削除"
      />
    </div>
  );
}
