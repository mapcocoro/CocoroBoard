import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Card, CardHeader, CardBody, Badge, EmptyState, ConfirmDialog, Input, Select, Textarea } from '../common';
import { TaskForm } from './TaskForm';
import { InvoiceForm } from '../invoices/InvoiceForm';
import { useTaskStore, useCustomerStore, useProjectStore, useInvoiceStore } from '../../stores';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ICONS, INVOICE_STATUS_LABELS } from '../../types';
import type { Task, ActivityType, Invoice } from '../../types';
import { format } from 'date-fns';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask, addActivity, removeActivity, toggleActivityCompleted } = useTaskStore();
  const { customers } = useCustomerStore();
  const { projects } = useProjectStore();
  const { getInvoicesByTask, addInvoice } = useInvoiceStore();

  const [task, setTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'other' as ActivityType,
    content: '',
  });

  useEffect(() => {
    const found = tasks.find((t) => t.id === id);
    setTask(found || null);
  }, [tasks, id]);

  if (!task) {
    return (
      <div className="h-full flex flex-col">
        <Header title="タスク詳細" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="❓"
            title="タスクが見つかりません"
            action={<Button onClick={() => navigate('/tasks')}>タスク一覧へ</Button>}
          />
        </div>
      </div>
    );
  }

  // 顧客IDを取得
  const getCustomerId = () => {
    const project = projects.find(p => p.id === task.projectId);
    if (!project || project.name === '自社開発タスク') return null;
    return project.customerId;
  };

  // 顧客名を取得
  const getCustomerName = () => {
    const customerId = getCustomerId();
    if (!customerId) return null;
    return customers.find(c => c.id === customerId)?.name;
  };

  const customerId = getCustomerId();
  const customerName = getCustomerName();
  const taskInvoices = getInvoicesByTask(task.id);

  const handleUpdate = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await updateTask(task.id, data);
    setIsEditModalOpen(false);
  };

  const handleDeleteTask = async () => {
    await deleteTask(task.id);
    navigate('/tasks');
  };

  const handleAddActivity = async () => {
    if (!newActivity.content.trim()) return;
    await addActivity(task.id, newActivity.type, newActivity.content.trim(), newActivity.date);
    setNewActivity({
      date: new Date().toISOString().split('T')[0],
      type: 'other',
      content: '',
    });
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = async (activityId: string) => {
    await removeActivity(task.id, activityId);
  };

  const handleToggleActivityCompleted = async (activityId: string) => {
    await toggleActivityCompleted(task.id, activityId);
  };

  const today = new Date().toISOString().split('T')[0];

  const handleAddInvoice = async (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addInvoice(data);
    setIsInvoiceModalOpen(false);
  };

  const getStatusBadgeVariant = (status: string) => {
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

  const getInvoiceStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        title={task.taskNumber ? `${task.taskNumber} ${task.name}` : task.name}
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
        {/* タスク情報 */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">タスク情報</h3>
            <div className="flex gap-2">
              <Badge variant={getStatusBadgeVariant(task.status)}>
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {customerName && (
                <>
                  <dt className="text-[var(--color-text-muted)]">顧客</dt>
                  <dd className="text-[var(--color-primary)]">{customerName}</dd>
                </>
              )}
              {!customerName && (
                <>
                  <dt className="text-[var(--color-text-muted)]">種別</dt>
                  <dd>自社開発</dd>
                </>
              )}
              {task.dueDate && (
                <>
                  <dt className="text-[var(--color-text-muted)]">期限</dt>
                  <dd>{format(new Date(task.dueDate), 'yyyy/MM/dd')}</dd>
                </>
              )}
              <dt className="text-[var(--color-text-muted)]">作成日</dt>
              <dd>{format(new Date(task.createdAt), 'yyyy/MM/dd')}</dd>
              {task.description && (
                <>
                  <dt className="text-[var(--color-text-muted)]">詳細</dt>
                  <dd className="col-span-2 whitespace-pre-wrap">{task.description}</dd>
                </>
              )}
              {task.domainInfo && (
                <>
                  <dt className="text-[var(--color-text-muted)]">ドメインメモ</dt>
                  <dd className="whitespace-pre-wrap">{task.domainInfo}</dd>
                </>
              )}
              {task.aiConsultUrl && (
                <>
                  <dt className="text-[var(--color-text-muted)]">AI相談URL</dt>
                  <dd>
                    <a
                      href={task.aiConsultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] hover:underline break-all"
                    >
                      {task.aiConsultUrl}
                    </a>
                  </dd>
                </>
              )}
              {task.githubUrl && (
                <>
                  <dt className="text-[var(--color-text-muted)]">GitHub</dt>
                  <dd>
                    <a
                      href={task.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] hover:underline break-all"
                    >
                      {task.githubUrl}
                    </a>
                  </dd>
                </>
              )}
              {task.usedServices && task.usedServices.length > 0 && (
                <>
                  <dt className="text-[var(--color-text-muted)]">使用サービス</dt>
                  <dd className="flex flex-wrap gap-1">
                    {task.usedServices.map((s) => {
                      const labels: Record<string, string> = {
                        github: 'GitHub',
                        firebase: 'Firebase',
                        cloudrun: 'Cloud Run',
                        vercel: 'Vercel',
                        supabase: 'Supabase',
                        microcms: 'MicroCMS',
                        payloadcms: 'PayloadCMS',
                        square: 'Square',
                        lightwidget: 'LightWidget',
                      };
                      return (
                        <span key={s} className="bg-gray-100 text-xs px-2 py-0.5 rounded">
                          {labels[s] || s}
                        </span>
                      );
                    })}
                  </dd>
                </>
              )}
              {task.codeFolder && (
                <>
                  <dt className="text-[var(--color-text-muted)]">コードフォルダ</dt>
                  <dd className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{task.codeFolder}</dd>
                </>
              )}
              {task.meetingFolder && (
                <>
                  <dt className="text-[var(--color-text-muted)]">打合せフォルダ</dt>
                  <dd className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{task.meetingFolder}</dd>
                </>
              )}
              {task.contractFolder && (
                <>
                  <dt className="text-[var(--color-text-muted)]">契約書フォルダ</dt>
                  <dd className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{task.contractFolder}</dd>
                </>
              )}
              {task.stagingUrl && (
                <>
                  <dt className="text-[var(--color-text-muted)]">検証URL</dt>
                  <dd>
                    <a
                      href={task.stagingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] hover:underline break-all"
                    >
                      {task.stagingUrl}
                    </a>
                  </dd>
                </>
              )}
              {task.productionUrl && (
                <>
                  <dt className="text-[var(--color-text-muted)]">公開URL</dt>
                  <dd>
                    <a
                      href={task.productionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] hover:underline break-all"
                    >
                      {task.productionUrl}
                    </a>
                  </dd>
                </>
              )}
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
            {(!task.activities || task.activities.length === 0) ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                活動ログがありません
              </p>
            ) : (
              <div className="space-y-3">
                {[...task.activities]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((activity) => {
                    const isFuture = activity.date >= today;
                    return (
                      <div
                        key={activity.id}
                        className={`flex items-start gap-3 p-3 rounded-md group ${
                          activity.completed
                            ? 'bg-gray-50 opacity-60'
                            : isFuture
                              ? 'bg-blue-50 border border-blue-100'
                              : 'bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleActivityCompleted(activity.id)}
                          className="text-xl flex-shrink-0 hover:scale-110 transition-transform"
                          title={activity.completed ? '未完了に戻す' : '完了にする'}
                        >
                          {activity.completed ? '☑️' : '☐'}
                        </button>
                        <span className="text-xl flex-shrink-0">
                          {isFuture && !activity.completed ? '📅' : ACTIVITY_TYPE_ICONS[activity.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${
                              isFuture && !activity.completed
                                ? 'text-blue-600'
                                : 'text-[var(--color-text-muted)]'
                            }`}>
                              {format(new Date(activity.date), 'yyyy/MM/dd')}
                            </span>
                            <Badge variant="default">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
                          </div>
                          <p className={`text-sm whitespace-pre-wrap ${
                            activity.completed
                              ? 'text-[var(--color-text-muted)] line-through'
                              : 'text-[var(--color-text)]'
                          }`}>{activity.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-[var(--color-text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="削除"
                        >
                          🗑
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 関連する請求 */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">関連する請求</h3>
            <div className="flex gap-2">
              {customerId && (
                <Button size="sm" onClick={() => setIsInvoiceModalOpen(true)}>
                  + 請求追加
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => navigate('/invoices')}>
                請求一覧へ
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {taskInvoices.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                関連する請求がありません
              </p>
            ) : (
              <div className="space-y-2">
                {taskInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-md bg-[var(--color-bg-hover)]"
                  >
                    <div>
                      <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {format(new Date(invoice.issueDate), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        ¥{invoice.amount.toLocaleString()}
                      </span>
                      <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="タスクを編集"
      >
        <TaskForm
          task={task}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
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
                { value: 'meeting', label: '打合せ' },
                { value: 'call', label: '電話' },
                { value: 'email', label: 'メール' },
                { value: 'other', label: 'その他' },
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
        onConfirm={handleDeleteTask}
        title="タスクを削除"
        message={`「${task.name}」を削除しますか？`}
        confirmLabel="削除"
      />

      {customerId && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title="請求を作成"
        >
          <InvoiceForm
            taskId={task.id}
            defaultCustomerId={customerId}
            onSubmit={handleAddInvoice}
            onCancel={() => setIsInvoiceModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
