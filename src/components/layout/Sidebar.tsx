import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ImportModal } from '../import/ImportModal';
import { ConfirmDialog } from '../common';
import { useProjectStore, useTaskStore, useCustomerStore } from '../../stores';

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { to: '/customers', label: '顧客', icon: '👥' },
  { to: '/tasks', label: 'タスク', icon: '✅' },
  { to: '/invoices', label: '請求', icon: '💰' },
];

export function Sidebar() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isMigrateOpen, setIsMigrateOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const { projects } = useProjectStore();
  const { addTask } = useTaskStore();
  const { customers } = useCustomerStore();

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  // 案件をタスクに移行
  const handleMigrate = async () => {
    setMigrating(true);
    try {
      // 「〇〇タスク」という名前の案件は除外（これはタスク用の内部案件）
      const projectsToMigrate = projects.filter(p => !p.name.includes('タスク'));

      // 自社開発タスク案件を探す
      const selfProject = projects.find(p => p.name === '自社開発タスク');
      const defaultProjectId = selfProject?.id || projects[0]?.id || '';

      for (const project of projectsToMigrate) {
        // 案件のステータスに応じてタスクのステータスを設定
        let taskStatus: 'todo' | 'in_progress' | 'done' = 'todo';
        if (project.status === 'completed') {
          taskStatus = 'done';
        } else if (project.status === 'in_progress' || project.status === 'waiting_review') {
          taskStatus = 'in_progress';
        }

        // 顧客名を取得
        const customer = customers.find(c => c.id === project.customerId);
        const customerName = customer?.name || '';

        // 案件の種別をタスク名のプレフィックスに
        let prefix = '';
        if (project.type === 'internal') prefix = '【自社】';
        else if (project.type === 'demo') prefix = '【デモ】';
        else if (project.type === 'client') prefix = '【受託】';

        await addTask({
          projectId: defaultProjectId,
          name: `${prefix}${project.name}`,
          description: [
            project.description,
            project.productionUrl && `公開URL: ${project.productionUrl}`,
            customerName && `顧客: ${customerName}`,
          ].filter(Boolean).join('\n'),
          status: taskStatus,
          priority: 'medium',
          dueDate: project.dueDate,
        });
      }

      alert(`${projectsToMigrate.length}件の案件をタスクに移行しました`);
      setIsMigrateOpen(false);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('移行に失敗しました');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <>
      <aside className="w-60 h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-border)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">CocoroBoard</h1>
        </div>
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)] font-medium'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 border-t border-[var(--color-border)] space-y-1">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors"
          >
            <span>📥</span>
            <span>データインポート</span>
          </button>
          <button
            onClick={() => setIsMigrateOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors"
          >
            <span>🔄</span>
            <span>案件→タスク移行</span>
          </button>
          <button
            onClick={() => setIsResetOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span>🗑</span>
            <span>データリセット</span>
          </button>
        </div>
      </aside>

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ConfirmDialog
        isOpen={isMigrateOpen}
        onClose={() => setIsMigrateOpen(false)}
        onConfirm={handleMigrate}
        title="案件をタスクに移行"
        message={`${projects.filter(p => !p.name.includes('タスク')).length}件の案件をタスクに移行します。この操作は元に戻せません。`}
        confirmLabel={migrating ? '移行中...' : '移行する'}
      />
      <ConfirmDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleReset}
        title="データリセット"
        message="すべてのデータを削除しますか？この操作は元に戻せません。"
        confirmLabel="リセット"
      />
    </>
  );
}
