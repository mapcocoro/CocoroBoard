import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Badge, EmptyState, ConfirmDialog, Card, CardBody, useViewMode } from '../common';
import { TaskForm } from './TaskForm';
import { useTaskStore, useProjectStore, useCustomerStore } from '../../stores';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types';
import type { Task, TaskStatus } from '../../types';
import { format } from 'date-fns';

export function TaskList() {
  const navigate = useNavigate();
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { customers } = useCustomerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [viewMode, setViewMode] = useViewMode('tasks', 'list');

  const handleCreate = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(data);
    setIsModalOpen(false);
  };

  const handleUpdate = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateTask(editTarget.id, data);
      setEditTarget(null);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteTask(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const getProjectName = (projectId: string) => {
    return getProject(projectId)?.name || '不明';
  };

  const getCustomerName = (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return '不明';
    return customers.find((c) => c.id === project.customerId)?.name || '不明';
  };

  const getCustomerId = (projectId: string) => {
    return getProject(projectId)?.customerId;
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

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { todo: 0, in_progress: 1, done: 2 };

    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="h-full flex flex-col">
      <Header
        title="タスク"
        action={
          <Button onClick={() => setIsModalOpen(true)}>+ 新規タスク</Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* フィルター & ビュー切り替え */}
        <div className="flex justify-between items-center mb-4">
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
            {sortedTasks.map((task) => (
              <Card key={task.id}>
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-[var(--color-text)] truncate">
                        {task.taskNumber && (
                          <span className="text-[var(--color-text-muted)] font-normal mr-2">{task.taskNumber}</span>
                        )}
                        {task.name}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-[var(--color-text-muted)] truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-1 text-xs">
                        <button
                          onClick={() => navigate(`/projects/${task.projectId}`)}
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {getProjectName(task.projectId)}
                        </button>
                        {getCustomerId(task.projectId) && (
                          <>
                            <span className="text-[var(--color-text-muted)]">/</span>
                            <button
                              onClick={() => navigate(`/customers/${getCustomerId(task.projectId)}`)}
                              className="text-[var(--color-primary)] hover:underline"
                            >
                              {getCustomerName(task.projectId)}
                            </button>
                          </>
                        )}
                      </div>
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
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-hover)]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">プロダクト/案件名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">案件</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">顧客</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">ステータス</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">優先度</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">期限</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)]"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {task.taskNumber || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-[var(--color-text)]">{task.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => navigate(`/projects/${task.projectId}`)}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {getProjectName(task.projectId)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getCustomerId(task.projectId) ? (
                        <button
                          onClick={() => navigate(`/customers/${getCustomerId(task.projectId)}`)}
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {getCustomerName(task.projectId)}
                        </button>
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
                ))}
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
