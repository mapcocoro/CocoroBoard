import { useState, useEffect } from 'react';
import { Input, Textarea, Select, Button } from '../common';
import { useCustomerStore, useProjectStore, useInvoiceStore } from '../../stores';
import type { Invoice, InvoiceStatus } from '../../types';
import { INVOICE_STATUS_LABELS } from '../../types';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const { customers } = useCustomerStore();
  const { projects } = useProjectStore();
  const { generateInvoiceNumber } = useInvoiceStore();

  const [formData, setFormData] = useState({
    customerId: '',
    projectId: '',
    invoiceNumber: '',
    estimateAmount: '',
    amount: '',
    tax: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paidDate: '',
    status: 'draft' as InvoiceStatus,
    memo: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        customerId: invoice.customerId,
        projectId: invoice.projectId || '',
        invoiceNumber: invoice.invoiceNumber,
        estimateAmount: invoice.estimateAmount?.toString() || '',
        amount: invoice.amount.toString(),
        tax: invoice.tax?.toString() || '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate || '',
        paidDate: invoice.paidDate || '',
        status: invoice.status,
        memo: invoice.memo || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber(),
      }));
    }
  }, [invoice, generateInvoiceNumber]);

  // 案件選択時に見積金額と請求番号を自動設定
  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setFormData({
      ...formData,
      projectId,
      // 案件IDがあれば請求番号として使用
      invoiceNumber: project?.projectNumber || formData.invoiceNumber,
      estimateAmount: project?.budget?.toString() || formData.estimateAmount,
    });
  };

  // 金額変更時に消費税を自動計算
  const handleAmountChange = (value: string) => {
    const amount = Number(value) || 0;
    const tax = Math.floor(amount * 0.1); // 10%で自動計算
    setFormData({
      ...formData,
      amount: value,
      tax: tax > 0 ? tax.toString() : '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerId: formData.customerId,
      projectId: formData.projectId || undefined,
      invoiceNumber: formData.invoiceNumber,
      estimateAmount: formData.estimateAmount ? Number(formData.estimateAmount) : undefined,
      amount: Number(formData.amount),
      tax: formData.tax ? Number(formData.tax) : undefined,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate || undefined,
      paidDate: formData.paidDate || undefined,
      status: formData.status,
      memo: formData.memo || undefined,
    });
  };

  const statusOptions = Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const customerOptions = [
    { value: '', label: '顧客を選択' },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const filteredProjects = formData.customerId
    ? projects.filter((p) => p.customerId === formData.customerId)
    : projects;

  const projectOptions = [
    { value: '', label: '案件なし' },
    ...filteredProjects.map((p) => ({ value: p.id, label: p.name })),
  ];

  // 合計金額（税込）
  const totalAmount = (Number(formData.amount) || 0) + (Number(formData.tax) || 0);

  // 見積との差額
  const estimateAmount = Number(formData.estimateAmount) || 0;
  const actualAmount = Number(formData.amount) || 0;
  const difference = actualAmount - estimateAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="請求番号 *"
        value={formData.invoiceNumber}
        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
        required
      />
      <Select
        label="顧客 *"
        value={formData.customerId}
        onChange={(e) => setFormData({ ...formData, customerId: e.target.value, projectId: '' })}
        options={customerOptions}
        required
      />
      <Select
        label="案件"
        value={formData.projectId}
        onChange={(e) => handleProjectChange(e.target.value)}
        options={projectOptions}
      />

      {/* 見積金額（手入力可能） */}
      <Input
        label="見積金額（税抜）"
        type="number"
        value={formData.estimateAmount}
        onChange={(e) => setFormData({ ...formData, estimateAmount: e.target.value })}
        placeholder="案件選択で自動入力、手動変更可"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="請求金額（税抜）*"
          type="number"
          value={formData.amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          required
          placeholder="100000"
        />
        <div>
          <Input
            label="消費税（10%）"
            type="number"
            value={formData.tax}
            onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
            placeholder="自動計算"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">金額入力で自動計算</p>
        </div>
      </div>

      {/* 合計金額と差額の表示 */}
      {totalAmount > 0 && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--color-text-muted)]">合計金額（税込）</span>
            <span className="text-xl font-bold text-[var(--color-primary)]">
              ¥{totalAmount.toLocaleString()}
            </span>
          </div>
          {estimateAmount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-text-muted)]">見積との差額</span>
              <span className={difference === 0 ? 'text-gray-500' : difference > 0 ? 'text-green-600' : 'text-red-500'}>
                {difference === 0 ? '±0' : difference > 0 ? `+¥${difference.toLocaleString()}` : `-¥${Math.abs(difference).toLocaleString()}`}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="発行日 *"
          type="date"
          value={formData.issueDate}
          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
          required
        />
        <Input
          label="支払期限"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="ステータス"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
          options={statusOptions}
        />
        <Input
          label="入金日"
          type="date"
          value={formData.paidDate}
          onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
        />
      </div>
      <Textarea
        label="メモ"
        value={formData.memo}
        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
        placeholder="備考"
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">{invoice ? '更新' : '作成'}</Button>
      </div>
    </form>
  );
}
