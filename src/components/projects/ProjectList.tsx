import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Card, CardBody, Badge, EmptyState, ConfirmDialog, useViewMode } from '../common';
import { ProjectForm } from './ProjectForm';
import { useProjectStore, useCustomerStore } from '../../stores';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '../../types';
import type { Project, ProjectType, ProjectStatus } from '../../types';
import { format } from 'date-fns';

export function ProjectList() {
  const navigate = useNavigate();
  const { projects, addProject, deleteProject } = useProjectStore();
  const { customers } = useCustomerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useViewMode('projects', 'card');

  const handleCreate = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProject(data);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || '不明';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
      case 'waiting_review':
        return 'info';
      case 'consulting':
      case 'estimating':
        return 'warning';
      case 'maintenance':
        return 'default';
      case 'lost':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTypeBadgeVariant = (type: ProjectType) => {
    switch (type) {
      case 'client':
        return 'info';
      case 'internal':
        return 'success';
      case 'demo':
        return 'warning';
      default:
        return 'default';
    }
  };

  // typeが未設定の場合は'client'として扱う
  const filteredProjects = projects
    .filter((p) => filterType === 'all' || (p.type || 'client') === filterType)
    .filter((p) => filterStatus === 'all' || p.status === filterStatus);

  return (
    <div className="h-full flex flex-col">
      <Header
        title="案件"
        action={
          <Button onClick={() => setIsModalOpen(true)}>+ 新規案件</Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* フィルター & ビュー切り替え */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            {(['all', 'client', 'internal', 'demo'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === type
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'すべて' : PROJECT_TYPE_LABELS[type]}
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

        {/* ステータスフィルター */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'consulting', 'estimating', 'in_progress', 'waiting_review', 'completed', 'maintenance', 'lost'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterStatus === status
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'すべて' : PROJECT_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="案件がありません"
            description={filterType === 'all' && filterStatus === 'all' ? '最初の案件を追加しましょう' : 'この条件の案件はありません'}
            action={filterType === 'all' && filterStatus === 'all' ? <Button onClick={() => setIsModalOpen(true)}>+ 新規案件</Button> : undefined}
          />
        ) : viewMode === 'card' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getTypeBadgeVariant(project.type || 'client')}>
                          {PROJECT_TYPE_LABELS[project.type || 'client']}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-[var(--color-text)] truncate">
                        {project.projectNumber && (
                          <span className="text-[var(--color-text-muted)] font-normal mr-2">{project.projectNumber}</span>
                        )}
                        {project.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${project.customerId}`);
                        }}
                        className="text-sm text-[var(--color-primary)] hover:underline text-left"
                      >
                        {getCustomerName(project.customerId)}
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(project);
                      }}
                      className="text-[var(--color-text-muted)] hover:text-red-500 p-1"
                    >
                      🗑
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                    {project.dueDate && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        納期: {format(new Date(project.dueDate), 'MM/dd')}
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">種別</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">案件名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">顧客</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">ステータス</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">納期</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {project.projectNumber || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getTypeBadgeVariant(project.type || 'client')}>
                        {PROJECT_TYPE_LABELS[project.type || 'client']}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-[var(--color-text)]">
                        {project.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${project.customerId}`);
                        }}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {getCustomerName(project.customerId)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {project.dueDate ? format(new Date(project.dueDate), 'yyyy/MM/dd') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(project);
                        }}
                        className="text-[var(--color-text-muted)] hover:text-red-500"
                      >
                        🗑
                      </button>
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
        title="新規案件"
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="案件を削除"
        message={`「${deleteTarget?.name}」を削除しますか？関連するタスクも削除されます。`}
        confirmLabel="削除"
      />
    </div>
  );
}
