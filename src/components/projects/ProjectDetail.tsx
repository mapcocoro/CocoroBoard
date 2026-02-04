import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Card, CardHeader, CardBody, Badge, EmptyState, ConfirmDialog, Input, Select, Textarea } from '../common';
import { ProjectForm } from './ProjectForm';
import { TaskForm } from '../tasks/TaskForm';
import { TaskKanban } from '../tasks/TaskKanban';
import { useProjectStore, useCustomerStore, useTaskStore } from '../../stores';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, PROJECT_CATEGORY_LABELS, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ICONS } from '../../types';
import type { Project, Task, ProjectType, Activity, ActivityType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// URLかローカルパスかを判定
const isUrl = (str: string) => str.startsWith('http://') || str.startsWith('https://');

// コピーボタン付きのパス/URL表示コンポーネント
function PathOrLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUrl(value)) {
    return (
      <div className="flex items-center gap-2">
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline break-all">
          {value}
        </a>
        <button
          onClick={handleCopy}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] flex-shrink-0"
          title="コピー"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
    );
  }

  // ローカルパスの場合
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--color-text)] break-all">{value}</span>
      <button
        onClick={handleCopy}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] flex-shrink-0"
        title="パスをコピー"
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject } = useProjectStore();
  const { customers } = useCustomerStore();
  const { tasks, addTask, deleteTask, moveTask } = useTaskStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'other' as ActivityType,
    content: '',
  });

  useEffect(() => {
    const found = projects.find((p) => p.id === id);
    setProject(found || null);
  }, [projects, id]);

  if (!project) {
    return (
      <div className="h-full flex flex-col">
        <Header title="案件詳細" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="❓"
            title="案件が見つかりません"
            action={<Button onClick={() => navigate('/projects')}>案件一覧へ</Button>}
          />
        </div>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === project.customerId);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  const handleUpdate = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProject(project.id, data);
    setIsEditModalOpen(false);
  };

  const handleAddTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask({ ...data, projectId: project.id });
    setIsTaskModalOpen(false);
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate('/projects');
  };

  const handleAddActivity = () => {
    if (!newActivity.content.trim()) return;

    const activity: Activity = {
      id: uuidv4(),
      date: newActivity.date,
      type: newActivity.type,
      content: newActivity.content.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedActivities = [...(project.activities || []), activity]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    updateProject(project.id, { activities: updatedActivities });
    setNewActivity({
      date: new Date().toISOString().split('T')[0],
      type: 'other',
      content: '',
    });
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    const updatedActivities = (project.activities || []).filter(a => a.id !== activityId);
    updateProject(project.id, { activities: updatedActivities });
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

  return (
    <div className="h-full flex flex-col">
      <Header
        title={project.projectNumber ? `${project.projectNumber} ${project.name}` : project.name}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
              編集
            </Button>
            <Button variant="danger" onClick={() => setDeleteConfirmOpen(true)}>
              削除
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* 案件情報 */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">案件情報</h3>
            <div className="flex gap-2">
              <Badge variant={getTypeBadgeVariant(project.type || 'client')}>
                {PROJECT_TYPE_LABELS[project.type || 'client']}
              </Badge>
              {project.category && (
                <Badge variant="default">
                  {PROJECT_CATEGORY_LABELS[project.category]}
                </Badge>
              )}
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-[var(--color-text-muted)]">顧客</dt>
              <dd>
                <button
                  onClick={() => navigate(`/customers/${project.customerId}`)}
                  className="text-[var(--color-primary)] hover:underline"
                >
                  {customer?.name || '不明'}
                </button>
              </dd>
              {project.startDate && (
                <>
                  <dt className="text-[var(--color-text-muted)]">開始日</dt>
                  <dd>{format(new Date(project.startDate), 'yyyy/MM/dd')}</dd>
                </>
              )}
              {project.dueDate && (
                <>
                  <dt className="text-[var(--color-text-muted)]">納期</dt>
                  <dd>{format(new Date(project.dueDate), 'yyyy/MM/dd')}</dd>
                </>
              )}
              {project.budget && (
                <>
                  <dt className="text-[var(--color-text-muted)]">予算</dt>
                  <dd>¥{project.budget.toLocaleString()}</dd>
                </>
              )}
              {project.description && (
                <>
                  <dt className="text-[var(--color-text-muted)]">説明</dt>
                  <dd className="col-span-2 whitespace-pre-wrap">{project.description}</dd>
                </>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* 追加情報 */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">追加情報</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">ドメイン情報</dt>
                <dd className="flex-1">{project.domainInfo || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">開発相談AI URL</dt>
                <dd className="flex-1">
                  {project.aiConsultUrl ? (
                    <PathOrLink value={project.aiConsultUrl} />
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">開発コードフォルダ</dt>
                <dd className="flex-1">
                  {project.codeFolder ? (
                    <PathOrLink value={project.codeFolder} />
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">打合せフォルダ</dt>
                <dd className="flex-1">
                  {project.meetingFolder ? (
                    <PathOrLink value={project.meetingFolder} />
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">契約関連フォルダ</dt>
                <dd className="flex-1">
                  {project.contractFolder ? (
                    <PathOrLink value={project.contractFolder} />
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">検証用URL</dt>
                <dd className="flex-1">
                  {project.stagingUrl ? (
                    <PathOrLink value={project.stagingUrl} />
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2">
                <dt className="w-40 text-[var(--color-text-muted)] flex-shrink-0">公開用URL</dt>
                <dd className="flex-1">
                  {project.productionUrl ? (
                    <PathOrLink value={project.productionUrl} />
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* 活動ログ */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">活動ログ</h3>
            <Button size="sm" onClick={() => setIsActivityModalOpen(true)}>
              + 追加
            </Button>
          </CardHeader>
          <CardBody>
            {(!project.activities || project.activities.length === 0) ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                活動ログがありません
              </p>
            ) : (
              <div className="space-y-3">
                {project.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-md bg-[var(--color-bg-hover)] group"
                  >
                    <span className="text-xl flex-shrink-0">{ACTIVITY_TYPE_ICONS[activity.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">
                          {format(new Date(activity.date), 'yyyy/MM/dd')}
                        </span>
                        <Badge variant="default">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
                      </div>
                      <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{activity.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="text-[var(--color-text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="削除"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* タスク（カンバン） */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">タスク</h3>
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              + 新規タスク
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            <TaskKanban
              tasks={projectTasks}
              onMoveTask={moveTask}
              onDeleteTask={deleteTask}
            />
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="案件を編集"
      >
        <ProjectForm
          project={project}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="新規タスク"
      >
        <TaskForm
          projectId={project.id}
          onSubmit={handleAddTask}
          onCancel={() => setIsTaskModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="活動を追加"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="日付"
              type="date"
              value={newActivity.date}
              onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
            />
            <Select
              label="種別"
              value={newActivity.type}
              onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as ActivityType })}
              options={[
                { value: 'meeting', label: '🤝 打合せ' },
                { value: 'call', label: '📞 電話' },
                { value: 'email', label: '📧 メール' },
                { value: 'other', label: '📝 その他' },
              ]}
            />
          </div>
          <Textarea
            label="内容"
            value={newActivity.content}
            onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
            placeholder="打合せ内容、やりとりのメモなど"
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsActivityModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddActivity} disabled={!newActivity.content.trim()}>
              追加
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title="案件を削除"
        message={`「${project.name}」を削除しますか？関連するタスクも削除されます。`}
        confirmLabel="削除"
      />
    </div>
  );
}
