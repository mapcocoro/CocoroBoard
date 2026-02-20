import { useState, useMemo } from 'react';
import { Header } from '../layout/Header';
import { Button, Modal, Badge, EmptyState, ConfirmDialog, Card, CardBody, useViewMode } from '../common';
import { InvoiceForm } from './InvoiceForm';
import { useInvoiceStore, useCustomerStore, useProjectStore } from '../../stores';
import { INVOICE_STATUS_LABELS } from '../../types';
import type { Invoice, InvoiceStatus } from '../../types';
import { format } from 'date-fns';

export function InvoiceList() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoiceStore();
  const { customers } = useCustomerStore();
  const { projects } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [viewMode, setViewMode] = useViewMode('invoices', 'list');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [salesBasis, setSalesBasis] = useState<'issue' | 'paid'>('issue');

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    invoices.forEach((inv) => {
      years.add(new Date(inv.issueDate).getFullYear());
      if (inv.paidDate) years.add(new Date(inv.paidDate).getFullYear());
    });
    return [...years].sort((a, b) => b - a);
  }, [invoices, currentYear]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      if (salesBasis === 'issue') {
        const monthInvoices = invoices.filter((inv) => {
          const d = new Date(inv.issueDate);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === month;
        });
        const amountExTax = monthInvoices.reduce((s, inv) => s + inv.amount, 0);
        const amountWithTax = monthInvoices.reduce((s, inv) => s + inv.amount + (inv.tax || 0), 0);
        const paidWithTax = monthInvoices
          .filter((inv) => inv.status === 'paid')
          .reduce((s, inv) => s + inv.amount + (inv.tax || 0), 0);
        const unpaidWithTax = monthInvoices
          .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
          .reduce((s, inv) => s + inv.amount + (inv.tax || 0), 0);
        return { month, count: monthInvoices.length, amountExTax, amountWithTax, paidWithTax, unpaidWithTax };
      } else {
        const monthInvoices = invoices.filter((inv) => {
          if (!inv.paidDate || inv.status !== 'paid') return false;
          const d = new Date(inv.paidDate);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === month;
        });
        const amountExTax = monthInvoices.reduce((s, inv) => s + inv.amount, 0);
        const amountWithTax = monthInvoices.reduce((s, inv) => s + inv.amount + (inv.tax || 0), 0);
        return { month, count: monthInvoices.length, amountExTax, amountWithTax, paidWithTax: amountWithTax, unpaidWithTax: 0 };
      }
    });
  }, [invoices, selectedYear, salesBasis]);

  const monthlyTotals = useMemo(() => ({
    count: monthlyData.reduce((s, m) => s + m.count, 0),
    amountExTax: monthlyData.reduce((s, m) => s + m.amountExTax, 0),
    amountWithTax: monthlyData.reduce((s, m) => s + m.amountWithTax, 0),
    paidWithTax: monthlyData.reduce((s, m) => s + m.paidWithTax, 0),
    unpaidWithTax: monthlyData.reduce((s, m) => s + m.unpaidWithTax, 0),
  }), [monthlyData]);

  const handleCreate = (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    addInvoice(data);
    setIsModalOpen(false);
  };

  const handleUpdate = (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateInvoice(editTarget.id, data);
      setEditTarget(null);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteInvoice(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || '不明';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '-';
    return projects.find((p) => p.id === projectId)?.name || '不明';
  };

  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'danger';
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  };

  const filteredInvoices = filterStatus === 'all'
    ? invoices
    : invoices.filter((i) => i.status === filterStatus);

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
  });

  // 税込金額を計算するヘルパー
  const getTotalWithTax = (inv: Invoice) => inv.amount + (inv.tax || 0);

  // 税抜金額
  const totalAmountExTax = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmountExTax = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidAmountExTax = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // 税込金額
  const totalAmountWithTax = invoices.reduce((sum, inv) => sum + getTotalWithTax(inv), 0);
  const paidAmountWithTax = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + getTotalWithTax(inv), 0);
  const unpaidAmountWithTax = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + getTotalWithTax(inv), 0);

  return (
    <div className="h-full flex flex-col">
      <Header
        title="請求"
        action={
          <Button onClick={() => setIsModalOpen(true)}>+ 新規請求</Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* サマリー */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-sm text-[var(--color-text-muted)]">総額</p>
            <p className="text-2xl font-semibold text-[var(--color-text)]">
              ¥{totalAmountExTax.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              （税込 ¥{totalAmountWithTax.toLocaleString()}）
            </p>
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-sm text-[var(--color-text-muted)]">入金済</p>
            <p className="text-2xl font-semibold text-green-600">
              ¥{paidAmountExTax.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              （税込 ¥{paidAmountWithTax.toLocaleString()}）
            </p>
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-sm text-[var(--color-text-muted)]">未入金</p>
            <p className="text-2xl font-semibold text-orange-500">
              ¥{unpaidAmountExTax.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              （税込 ¥{unpaidAmountWithTax.toLocaleString()}）
            </p>
          </div>
        </div>

        {/* 年次売上サマリー */}
        <div className="bg-white border border-[var(--color-border)] rounded-lg mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-hover)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">年次売上サマリー</h2>
            <div className="flex items-center gap-3">
              {/* 発行日 / 入金日 切り替え */}
              <div className="flex border border-[var(--color-border)] rounded-md overflow-hidden text-xs">
                <button
                  onClick={() => setSalesBasis('issue')}
                  className={`px-3 py-1.5 transition-colors ${salesBasis === 'issue' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-[var(--color-text-muted)] hover:bg-gray-50'}`}
                >
                  発行日基準
                </button>
                <button
                  onClick={() => setSalesBasis('paid')}
                  className={`px-3 py-1.5 transition-colors ${salesBasis === 'paid' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-[var(--color-text-muted)] hover:bg-gray-50'}`}
                >
                  入金日基準
                </button>
              </div>
              {/* 年選択 */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm border border-[var(--color-border)] rounded-md px-2 py-1 bg-white text-[var(--color-text)]"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">月</th>
                  <th className="text-right px-4 py-2 font-medium text-[var(--color-text-muted)]">件数</th>
                  <th className="text-right px-4 py-2 font-medium text-[var(--color-text-muted)]">
                    {salesBasis === 'issue' ? '請求額（税抜）' : '入金額（税抜）'}
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-[var(--color-text-muted)]">
                    {salesBasis === 'issue' ? '請求額（税込）' : '入金額（税込）'}
                  </th>
                  {salesBasis === 'issue' && (
                    <>
                      <th className="text-right px-4 py-2 font-medium text-[var(--color-text-muted)]">入金済（税込）</th>
                      <th className="text-right px-4 py-2 font-medium text-[var(--color-text-muted)]">未入金（税込）</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => (
                  <tr
                    key={row.month}
                    className={`border-b border-[var(--color-border)] last:border-b-0 ${row.count === 0 ? 'text-[var(--color-text-muted)]' : 'hover:bg-[var(--color-bg-hover)]'}`}
                  >
                    <td className="px-4 py-2">{row.month}月</td>
                    <td className="text-right px-4 py-2">{row.count > 0 ? row.count : '-'}</td>
                    <td className="text-right px-4 py-2">
                      {row.amountExTax > 0 ? `¥${row.amountExTax.toLocaleString()}` : '-'}
                    </td>
                    <td className="text-right px-4 py-2 font-medium">
                      {row.amountWithTax > 0 ? `¥${row.amountWithTax.toLocaleString()}` : '-'}
                    </td>
                    {salesBasis === 'issue' && (
                      <>
                        <td className="text-right px-4 py-2 text-green-600">
                          {row.paidWithTax > 0 ? `¥${row.paidWithTax.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right px-4 py-2 text-orange-500">
                          {row.unpaidWithTax > 0 ? `¥${row.unpaidWithTax.toLocaleString()}` : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {/* 合計行 */}
                <tr className="bg-[var(--color-bg-hover)] font-semibold border-t-2 border-[var(--color-border)]">
                  <td className="px-4 py-2">合計</td>
                  <td className="text-right px-4 py-2">{monthlyTotals.count > 0 ? monthlyTotals.count : '-'}</td>
                  <td className="text-right px-4 py-2">
                    {monthlyTotals.amountExTax > 0 ? `¥${monthlyTotals.amountExTax.toLocaleString()}` : '-'}
                  </td>
                  <td className="text-right px-4 py-2">
                    {monthlyTotals.amountWithTax > 0 ? `¥${monthlyTotals.amountWithTax.toLocaleString()}` : '-'}
                  </td>
                  {salesBasis === 'issue' && (
                    <>
                      <td className="text-right px-4 py-2 text-green-600">
                        {monthlyTotals.paidWithTax > 0 ? `¥${monthlyTotals.paidWithTax.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right px-4 py-2 text-orange-500">
                        {monthlyTotals.unpaidWithTax > 0 ? `¥${monthlyTotals.unpaidWithTax.toLocaleString()}` : '-'}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* フィルター & ビュー切り替え */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {(['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterStatus === status
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'すべて' : INVOICE_STATUS_LABELS[status]}
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

        {sortedInvoices.length === 0 ? (
          <EmptyState
            icon="💰"
            title="請求がありません"
            description={filterStatus === 'all' ? '最初の請求を作成しましょう' : 'このステータスの請求はありません'}
            action={filterStatus === 'all' ? <Button onClick={() => setIsModalOpen(true)}>+ 新規請求</Button> : undefined}
          />
        ) : viewMode === 'card' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--color-text-muted)]">{invoice.invoiceNumber}</p>
                      <h3 className="font-medium text-[var(--color-text)]">
                        {getCustomerName(invoice.customerId)}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {getProjectName(invoice.projectId)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditTarget(invoice)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteTarget(invoice)}
                        className="text-[var(--color-text-muted)] hover:text-red-500 p-1"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--color-text)]">
                          ¥{invoice.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          （税込 ¥{getTotalWithTax(invoice).toLocaleString()}）
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      発行日: {format(new Date(invoice.issueDate), 'yyyy/MM/dd')}
                    </p>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">請求番号</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">顧客</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">案件</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">金額</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">発行日</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">ステータス</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-[var(--color-text)]">
                        {invoice.invoiceNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {getCustomerName(invoice.customerId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {getProjectName(invoice.projectId)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-sm">
                        ¥{invoice.amount.toLocaleString()}
                      </span>
                      <br />
                      <span className="text-xs text-[var(--color-text-muted)]">
                        （税込 ¥{getTotalWithTax(invoice).toLocaleString()}）
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {format(new Date(invoice.issueDate), 'yyyy/MM/dd')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditTarget(invoice)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteTarget(invoice)}
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
        title="新規請求"
      >
        <InvoiceForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="請求を編集"
      >
        {editTarget && (
          <InvoiceForm
            invoice={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="請求を削除"
        message={`「${deleteTarget?.invoiceNumber}」を削除しますか？`}
        confirmLabel="削除"
      />
    </div>
  );
}
