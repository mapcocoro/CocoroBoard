import { useNavigate } from 'react-router-dom';
import { Header } from './layout/Header';
import { Card, CardHeader, CardBody, Badge } from './common';
import { useCustomerStore, useProjectStore, useTaskStore, useInvoiceStore } from '../stores';
import { PROJECT_STATUS_LABELS, TASK_PRIORITY_LABELS, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from '../types';
import type { Activity } from '../types';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export function Dashboard() {
  const navigate = useNavigate();
  const { customers } = useCustomerStore();
  const { projects, toggleActivityCompleted: toggleProjectActivityCompleted } = useProjectStore();
  const { tasks, toggleActivityCompleted: toggleTaskActivityCompleted } = useTaskStore();
  const { invoices } = useInvoiceStore();

  const today = new Date();
  const weekLater = addDays(today, 7);

  // 受託案件がある顧客（顧客一覧と同じフィルタ）
  const clientCustomers = customers.filter((customer) => {
    const customerProjects = projects.filter((p) => p.customerId === customer.id);
    if (customerProjects.length === 0) return true;
    const allInternalOrDemo = customerProjects.every(
      (p) => (p.type || 'client') === 'internal' || (p.type || 'client') === 'demo'
    );
    return !allInternalOrDemo;
  });

  // 進行中の案件（制作中・確認待ち）
  const activeProjects = projects.filter((p) => p.status === 'in_progress' || p.status === 'waiting_review');

  // 未完了タスク（期限近い順）
  const pendingTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  // 納期間近の案件（1週間以内）
  const upcomingDeadlines = projects
    .filter((p) => {
      if (!p.dueDate || p.status === 'completed' || p.status === 'lost') return false;
      const dueDate = new Date(p.dueDate);
      return isAfter(dueDate, today) && isBefore(dueDate, weekLater);
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  // ネクストアクション（未完了の活動）
  const todayStr = format(today, 'yyyy-MM-dd');

  interface NextAction {
    activity: Activity;
    sourceType: 'task' | 'project';
    sourceId: string;
    sourceName: string;
    customerName?: string;
  }

  const nextActions: NextAction[] = [];

  // タスクの活動を収集
  tasks.forEach((task) => {
    const project = projects.find(p => p.id === task.projectId);
    const customer = project ? customers.find(c => c.id === project.customerId) : null;

    (task.activities || []).forEach((activity) => {
      if (!activity.completed && activity.date >= todayStr) {
        nextActions.push({
          activity,
          sourceType: 'task',
          sourceId: task.id,
          sourceName: task.name,
          customerName: customer?.name,
        });
      }
    });
  });

  // プロジェクトの活動を収集
  projects.forEach((project) => {
    const customer = customers.find(c => c.id === project.customerId);

    (project.activities || []).forEach((activity) => {
      if (!activity.completed && activity.date >= todayStr) {
        nextActions.push({
          activity,
          sourceType: 'project',
          sourceId: project.id,
          sourceName: project.name,
          customerName: customer?.name,
        });
      }
    });
  });

  // 日付順にソートして最大10件
  const sortedNextActions = nextActions
    .sort((a, b) => new Date(a.activity.date).getTime() - new Date(b.activity.date).getTime())
    .slice(0, 10);

  // 売上サマリー
  const getTotalWithTax = (inv: { amount: number; tax?: number }) => inv.amount + (inv.tax || 0);

  // 税抜金額
  const paidAmountExTax = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const unpaidAmountExTax = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.amount, 0);

  // 税込金額
  const paidAmountWithTax = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + getTotalWithTax(i), 0);
  const unpaidAmountWithTax = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + getTotalWithTax(i), 0);

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || '不明';
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

  return (
    <div className="h-full flex flex-col">
      <Header title="ダッシュボード" />
      <div className="flex-1 p-6 overflow-auto">
        {/* サマリーカード */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody>
              <p className="text-sm text-[var(--color-text-muted)]">顧客数</p>
              <p className="text-3xl font-semibold text-[var(--color-text)]">{clientCustomers.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-[var(--color-text-muted)]">進行中案件</p>
              <p className="text-3xl font-semibold text-[var(--color-text)]">{activeProjects.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-[var(--color-text-muted)]">入金済</p>
              <p className="text-3xl font-semibold text-green-600">¥{paidAmountExTax.toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                （税込 ¥{paidAmountWithTax.toLocaleString()}）
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-[var(--color-text-muted)]">未入金</p>
              <p className="text-3xl font-semibold text-orange-500">¥{unpaidAmountExTax.toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                （税込 ¥{unpaidAmountWithTax.toLocaleString()}）
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 直近タスク */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="font-medium">直近のタスク</h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                すべて表示
              </button>
            </CardHeader>
            <CardBody>
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                  未完了のタスクはありません
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-hover)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {task.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {format(new Date(task.dueDate), 'MM/dd')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* 納期間近 */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="font-medium">納期間近の案件</h3>
              <button
                onClick={() => navigate('/projects')}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                すべて表示
              </button>
            </CardHeader>
            <CardBody>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                  今週納期の案件はありません
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-hover)] cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {getCustomerName(project.customerId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">
                          {PROJECT_STATUS_LABELS[project.status]}
                        </Badge>
                        <span className="text-xs font-medium text-orange-500">
                          {format(new Date(project.dueDate!), 'MM/dd')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ネクストアクション */}
        <Card className="mt-6">
          <CardHeader>
            <h3 className="font-medium flex items-center gap-2">
              <span>📅</span>
              ネクストアクション
            </h3>
          </CardHeader>
          <CardBody>
            {sortedNextActions.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                予定されているアクションはありません
              </p>
            ) : (
              <div className="space-y-2">
                {sortedNextActions.map((item) => (
                  <div
                    key={`${item.sourceType}-${item.sourceId}-${item.activity.id}`}
                    className="flex items-center gap-3 p-3 rounded-md bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (item.sourceType === 'task') {
                          await toggleTaskActivityCompleted(item.sourceId, item.activity.id);
                        } else {
                          await toggleProjectActivityCompleted(item.sourceId, item.activity.id);
                        }
                      }}
                      className="text-xl flex-shrink-0 hover:scale-110 transition-transform"
                      title="完了にする"
                    >
                      ☐
                    </button>
                    <span className="text-lg flex-shrink-0">{ACTIVITY_TYPE_ICONS[item.activity.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-600">
                          {format(new Date(item.activity.date), 'M/d')}
                        </span>
                        <Badge variant="default">{ACTIVITY_TYPE_LABELS[item.activity.type]}</Badge>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {item.customerName && `${item.customerName} / `}{item.sourceName}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text)] truncate mt-1">
                        {item.activity.content}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(
                        item.sourceType === 'task'
                          ? `/tasks/${item.sourceId}`
                          : `/projects/${item.sourceId}`
                      )}
                      className="text-xs text-[var(--color-primary)] hover:underline flex-shrink-0"
                    >
                      詳細 →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 進行中案件一覧 */}
        <Card className="mt-6">
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">進行中の案件</h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              すべて表示
            </button>
          </CardHeader>
          <CardBody>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                進行中の案件はありません
              </p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.slice(0, 6).map((project) => {
                  const projectTasks = tasks.filter((t) => t.projectId === project.id);
                  const completedTasks = projectTasks.filter((t) => t.status === 'done');
                  const progress = projectTasks.length > 0
                    ? Math.round((completedTasks.length / projectTasks.length) * 100)
                    : 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="border border-[var(--color-border)] rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-sm text-[var(--color-text)] truncate">
                        {project.name}
                      </h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {getCustomerName(project.customerId)}
                      </p>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
                          <span>進捗</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
