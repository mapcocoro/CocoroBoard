import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ImportModal } from '../import/ImportModal';
import { ConfirmDialog } from '../common';

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { to: '/customers', label: '顧客', icon: '👥' },
  { to: '/projects', label: '案件', icon: '📁' },
  { to: '/tasks', label: 'タスク', icon: '✅' },
  { to: '/invoices', label: '請求', icon: '💰' },
];

export function Sidebar() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
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
