import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Card, CardBody, EmptyState, ConfirmDialog, useViewMode } from '../common';
import { CustomerForm } from './CustomerForm';
import { useCustomerStore, useProjectStore } from '../../stores';
import type { Customer } from '../../types';

export function CustomerList() {
  const navigate = useNavigate();
  const { customers, addCustomer, deleteCustomer } = useCustomerStore();
  const { projects } = useProjectStore();

  // クライアントワーク（受託案件）がある顧客のみ表示
  // 自社プロダクト/デモのみの顧客は除外
  const clientCustomers = customers.filter((customer) => {
    const customerProjects = projects.filter((p) => p.customerId === customer.id);
    // 案件がなければ表示
    if (customerProjects.length === 0) return true;
    // typeが未設定の場合は'client'として扱う
    // すべての案件が internal または demo の場合のみ非表示
    const allInternalOrDemo = customerProjects.every(
      (p) => (p.type || 'client') === 'internal' || (p.type || 'client') === 'demo'
    );
    return !allInternalOrDemo;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useViewMode('customers', 'card');

  // 各顧客の案件数を取得
  const getProjectCount = (customerId: string) => {
    return projects.filter((p) => p.customerId === customerId).length;
  };

  const handleCreate = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    addCustomer(data);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        title="顧客"
        action={
          <Button onClick={() => setIsModalOpen(true)}>+ 新規顧客</Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* ビュー切り替え */}
        {clientCustomers.length > 0 && (
          <div className="flex justify-end mb-4">
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
        )}

        {clientCustomers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="顧客がいません"
            description="最初の顧客を追加しましょう"
            action={<Button onClick={() => setIsModalOpen(true)}>+ 新規顧客</Button>}
          />
        ) : viewMode === 'card' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientCustomers.map((customer) => (
              <Card
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-[var(--color-text)] truncate">
                        {customer.name}
                      </h3>
                      {customer.company && (
                        <p className="text-sm text-[var(--color-text-muted)] truncate">
                          {customer.company}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-[var(--color-text-muted)] truncate mt-1">
                          {customer.email}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(customer);
                      }}
                      className="text-[var(--color-text-muted)] hover:text-red-500 p-1"
                    >
                      🗑
                    </button>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">顧客名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">会社名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">メール</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">案件数</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {clientCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-[var(--color-text)]">
                        {customer.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {customer.company || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {getProjectCount(customer.id)}件
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(customer);
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
        title="新規顧客"
      >
        <CustomerForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="顧客を削除"
        message={`「${deleteTarget?.name}」を削除しますか？関連する案件や請求も削除されます。`}
        confirmLabel="削除"
      />
    </div>
  );
}
