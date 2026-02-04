import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Button, Modal, Card, CardHeader, CardBody, Badge, EmptyState, ConfirmDialog } from '../common';
import { CustomerForm } from './CustomerForm';
import { ProjectForm } from '../projects/ProjectForm';
import { useCustomerStore, useProjectStore, useInvoiceStore } from '../../stores';
import { PROJECT_STATUS_LABELS, INVOICE_STATUS_LABELS } from '../../types';
import type { Customer, Project } from '../../types';
import { format } from 'date-fns';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, updateCustomer, deleteCustomer } = useCustomerStore();
  const { projects, addProject, deleteProject } = useProjectStore();
  const { invoices } = useInvoiceStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'customer' | 'project'; item: Customer | Project } | null>(null);

  useEffect(() => {
    const found = customers.find((c) => c.id === id);
    setCustomer(found || null);
  }, [customers, id]);

  if (!customer) {
    return (
      <div className="h-full flex flex-col">
        <Header title="顧客詳細" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="❓"
            title="顧客が見つかりません"
            action={<Button onClick={() => navigate('/customers')}>顧客一覧へ</Button>}
          />
        </div>
      </div>
    );
  }

  const customerProjects = projects.filter((p) => p.customerId === customer.id);
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);

  const handleUpdate = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateCustomer(customer.id, data);
    setIsEditModalOpen(false);
  };

  const handleAddProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProject({ ...data, customerId: customer.id });
    setIsProjectModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'customer') {
      deleteCustomer(customer.id);
      navigate('/customers');
    } else {
      deleteProject(deleteTarget.item.id);
    }
    setDeleteTarget(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'success';
      case 'in_progress':
      case 'waiting_review':
      case 'sent':
        return 'info';
      case 'consulting':
      case 'estimating':
      case 'overdue':
        return 'warning';
      case 'maintenance':
        return 'default';
      case 'lost':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        title={customer.name}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
              編集
            </Button>
            <Button variant="danger" onClick={() => setDeleteTarget({ type: 'customer', item: customer })}>
              削除
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* 顧客情報 */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">顧客情報</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">会社名</dt>
                <dd className="flex-1">{customer.company || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">メール</dt>
                <dd className="flex-1">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-[var(--color-primary)] hover:underline">
                      {customer.email}
                    </a>
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">電話</dt>
                <dd className="flex-1">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="text-[var(--color-primary)] hover:underline">
                      {customer.phone}
                    </a>
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">WebサイトURL</dt>
                <dd className="flex-1">
                  {customer.website ? (
                    <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                      {customer.website}
                    </a>
                  ) : <span className="text-gray-300">未入力</span>}
                </dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">住所</dt>
                <dd className="flex-1">{customer.address || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">担当者名</dt>
                <dd className="flex-1">{customer.contactPerson || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">役職</dt>
                <dd className="flex-1">{customer.position || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">種別</dt>
                <dd className="flex-1">{customer.category || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex items-center gap-4 py-2 border-b border-[var(--color-border)]">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">紹介元</dt>
                <dd className="flex-1">{customer.referralSource || <span className="text-gray-300">未入力</span>}</dd>
              </div>
              <div className="flex gap-4 py-2">
                <dt className="w-32 text-[var(--color-text-muted)] flex-shrink-0">メモ</dt>
                <dd className="flex-1 whitespace-pre-wrap">{customer.memo || <span className="text-gray-300">未入力</span>}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* 案件一覧 */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-medium">案件</h3>
            <Button size="sm" onClick={() => setIsProjectModalOpen(true)}>
              + 新規案件
            </Button>
          </CardHeader>
          <CardBody>
            {customerProjects.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                案件がありません
              </p>
            ) : (
              <div className="space-y-2">
                {customerProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-sm">{project.name}</p>
                      {project.dueDate && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          納期: {format(new Date(project.dueDate), 'yyyy/MM/dd')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ type: 'project', item: project });
                        }}
                        className="text-[var(--color-text-muted)] hover:text-red-500 p-1"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 請求一覧 */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">請求</h3>
          </CardHeader>
          <CardBody>
            {customerInvoices.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                請求がありません
              </p>
            ) : (
              <div className="space-y-2">
                {customerInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-[var(--color-bg-hover)]"
                  >
                    <div>
                      <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        発行日: {format(new Date(invoice.issueDate), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        ¥{invoice.amount.toLocaleString()}
                      </span>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
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
        title="顧客を編集"
      >
        <CustomerForm
          customer={customer}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="新規案件"
      >
        <ProjectForm
          customerId={customer.id}
          onSubmit={handleAddProject}
          onCancel={() => setIsProjectModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'customer' ? '顧客を削除' : '案件を削除'}
        message={
          deleteTarget?.type === 'customer'
            ? `「${customer.name}」を削除しますか？関連する案件や請求も削除されます。`
            : `「${(deleteTarget?.item as Project)?.name}」を削除しますか？`
        }
        confirmLabel="削除"
      />
    </div>
  );
}
