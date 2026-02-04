import { useState, useEffect } from 'react';
import { Input, Textarea, Select, Button } from '../common';
import { useCustomerStore } from '../../stores';
import type { Project, ProjectStatus, ProjectType, ProjectCategory } from '../../types';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, PROJECT_CATEGORY_LABELS } from '../../types';

interface ProjectFormProps {
  project?: Project;
  customerId?: string;
  defaultType?: ProjectType;
  onSubmit: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function ProjectForm({ project, customerId, defaultType = 'client', onSubmit, onCancel }: ProjectFormProps) {
  const { customers } = useCustomerStore();
  const [formData, setFormData] = useState({
    name: '',
    customerId: customerId || '',
    description: '',
    type: defaultType as ProjectType,
    category: '' as ProjectCategory | '',
    status: 'consulting' as ProjectStatus,
    startDate: '',
    dueDate: '',
    budget: '',
    domainInfo: '',
    aiConsultUrl: '',
    codeFolder: '',
    meetingFolder: '',
    contractFolder: '',
    stagingUrl: '',
    productionUrl: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        customerId: project.customerId,
        description: project.description || '',
        type: project.type || 'client',
        category: project.category || '',
        status: project.status,
        startDate: project.startDate || '',
        dueDate: project.dueDate || '',
        budget: project.budget?.toString() || '',
        domainInfo: project.domainInfo || '',
        aiConsultUrl: project.aiConsultUrl || '',
        codeFolder: project.codeFolder || '',
        meetingFolder: project.meetingFolder || '',
        contractFolder: project.contractFolder || '',
        stagingUrl: project.stagingUrl || '',
        productionUrl: project.productionUrl || '',
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      category: formData.category || undefined,
      budget: formData.budget ? Number(formData.budget) : undefined,
      domainInfo: formData.domainInfo || undefined,
      aiConsultUrl: formData.aiConsultUrl || undefined,
      codeFolder: formData.codeFolder || undefined,
      meetingFolder: formData.meetingFolder || undefined,
      contractFolder: formData.contractFolder || undefined,
      stagingUrl: formData.stagingUrl || undefined,
      productionUrl: formData.productionUrl || undefined,
    });
  };

  const typeOptions = Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const categoryOptions = [
    { value: '', label: '選択してください' },
    ...Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const customerOptions = [
    { value: '', label: '顧客を選択' },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="案件名 *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        placeholder="Webサイトリニューアル"
      />
      {!customerId && (
        <Select
          label="顧客 *"
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          options={customerOptions}
          required
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="種別"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
          options={typeOptions}
        />
        <Select
          label="カテゴリ"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
          options={categoryOptions}
        />
      </div>
      <Select
        label="ステータス"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
        options={statusOptions}
      />
      <Textarea
        label="説明"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="案件の概要"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="開始日"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />
        <Input
          label="納期"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>
      <Input
        label="予算"
        type="number"
        value={formData.budget}
        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
        placeholder="100000"
      />

      {/* 追加情報 */}
      <div className="border-t border-[var(--color-border)] pt-4 mt-4">
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">追加情報</p>
        <div className="space-y-4">
          <Input
            label="ドメイン情報"
            value={formData.domainInfo}
            onChange={(e) => setFormData({ ...formData, domainInfo: e.target.value })}
            placeholder="example.com"
          />
          <Input
            label="開発相談AI URL"
            value={formData.aiConsultUrl}
            onChange={(e) => setFormData({ ...formData, aiConsultUrl: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="開発コードフォルダ"
            value={formData.codeFolder}
            onChange={(e) => setFormData({ ...formData, codeFolder: e.target.value })}
            placeholder="/Users/..."
          />
          <Input
            label="打合せフォルダ"
            value={formData.meetingFolder}
            onChange={(e) => setFormData({ ...formData, meetingFolder: e.target.value })}
            placeholder="https://drive.google.com/..."
          />
          <Input
            label="契約関連フォルダ"
            value={formData.contractFolder}
            onChange={(e) => setFormData({ ...formData, contractFolder: e.target.value })}
            placeholder="https://drive.google.com/..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="検証用URL"
              value={formData.stagingUrl}
              onChange={(e) => setFormData({ ...formData, stagingUrl: e.target.value })}
              placeholder="https://staging.example.com"
            />
            <Input
              label="公開用URL"
              value={formData.productionUrl}
              onChange={(e) => setFormData({ ...formData, productionUrl: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">{project ? '更新' : '作成'}</Button>
      </div>
    </form>
  );
}
