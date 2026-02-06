import { useState, useEffect } from 'react';
import { Input, Textarea, Select, Button } from '../common';
import { useProjectStore, useCustomerStore } from '../../stores';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, customerId?: string) => void;
  onCancel: () => void;
}

export function TaskForm({ task, projectId, onSubmit, onCancel }: TaskFormProps) {
  const { projects } = useProjectStore();
  const { customers } = useCustomerStore();

  // 「自社開発タスク」を探す（なければ最初のプロジェクト）
  const defaultProject = projects.find(p => p.name === '自社開発タスク') || projects[0];
  const defaultProjectId = projectId || defaultProject?.id || '';

  // 編集時: タスクの案件から顧客IDを取得
  const getCustomerIdFromTask = (t: Task) => {
    const project = projects.find(p => p.id === t.projectId);
    // 「自社開発タスク」に紐づいている場合は顧客なし
    if (project?.name === '自社開発タスク') return '';
    return project?.customerId || '';
  };

  const [formData, setFormData] = useState({
    name: '',
    projectId: defaultProjectId,
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: '',
    domainInfo: '',
    aiConsultUrl: '',
    codeFolder: '',
    meetingFolder: '',
    contractFolder: '',
    stagingUrl: '',
    productionUrl: '',
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // 自社系カテゴリかどうかを判定
  const isSelfCategory = (name: string) => {
    const selfPatterns = ['自社', 'demo/', 'Demo/', 'Pro/', 'その他/', '未分類'];
    return selfPatterns.some(pattern => name.includes(pattern) || name.toLowerCase().startsWith(pattern.toLowerCase()));
  };

  // 自社カテゴリと顧客を分離
  const selfCategories = customers.filter(c => isSelfCategory(c.name));
  const realCustomers = customers.filter(c => !isSelfCategory(c.name) && c.name !== '自社開発');

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        projectId: task.projectId,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || '',
        domainInfo: task.domainInfo || '',
        aiConsultUrl: task.aiConsultUrl || '',
        codeFolder: task.codeFolder || '',
        meetingFolder: task.meetingFolder || '',
        contractFolder: task.contractFolder || '',
        stagingUrl: task.stagingUrl || '',
        productionUrl: task.productionUrl || '',
      });
      const customerId = getCustomerIdFromTask(task);
      if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer && isSelfCategory(customer.name)) {
          setSelectedCategoryId(customerId);
          setSelectedCustomerId('');
        } else {
          setSelectedCustomerId(customerId);
          setSelectedCategoryId('');
        }
      }
    }
  }, [task]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (categoryId) {
      setSelectedCustomerId(''); // 顧客をクリア
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      setSelectedCategoryId(''); // カテゴリをクリア
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // カテゴリか顧客、どちらかを渡す
    const effectiveCustomerId = selectedCustomerId || selectedCategoryId || undefined;
    onSubmit(formData, effectiveCustomerId);
  };

  const statusOptions = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const categoryOptions = [
    { value: '', label: '選択なし' },
    ...selfCategories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const customerOptions = [
    { value: '', label: '選択なし' },
    ...realCustomers.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="タスク名 *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        placeholder="【開発】〇〇機能追加"
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="自社カテゴリ"
          value={selectedCategoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          options={categoryOptions}
        />
        <Select
          label="顧客"
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          options={customerOptions}
        />
      </div>
      <Textarea
        label="詳細"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="タスクの詳細・メモ"
      />
      <Input
        label="ドメインメモ"
        value={formData.domainInfo}
        onChange={(e) => setFormData({ ...formData, domainInfo: e.target.value })}
        placeholder="example.com / ID: xxx / PW: xxx"
      />
      <Input
        label="AI相談URL"
        value={formData.aiConsultUrl}
        onChange={(e) => setFormData({ ...formData, aiConsultUrl: e.target.value })}
        placeholder="https://claude.ai/chat/xxx"
      />
      <Input
        label="コードフォルダ"
        value={formData.codeFolder}
        onChange={(e) => setFormData({ ...formData, codeFolder: e.target.value })}
        placeholder="/path/to/code"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="打合せフォルダ"
          value={formData.meetingFolder}
          onChange={(e) => setFormData({ ...formData, meetingFolder: e.target.value })}
          placeholder="/path/to/meeting"
        />
        <Input
          label="契約書フォルダ"
          value={formData.contractFolder}
          onChange={(e) => setFormData({ ...formData, contractFolder: e.target.value })}
          placeholder="/path/to/contract"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="検証URL"
          value={formData.stagingUrl}
          onChange={(e) => setFormData({ ...formData, stagingUrl: e.target.value })}
          placeholder="https://staging.example.com"
        />
        <Input
          label="公開URL"
          value={formData.productionUrl}
          onChange={(e) => setFormData({ ...formData, productionUrl: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="ステータス"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
          options={statusOptions}
        />
        <Select
          label="優先度"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
          options={priorityOptions}
        />
      </div>
      <Input
        label="期限"
        type="date"
        value={formData.dueDate}
        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">{task ? '更新' : '作成'}</Button>
      </div>
    </form>
  );
}
