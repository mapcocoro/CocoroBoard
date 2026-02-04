import { useState, useEffect } from 'react';
import { Input, Textarea, Select, Button } from '../common';
import { useProjectStore } from '../../stores';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function TaskForm({ task, projectId, onSubmit, onCancel }: TaskFormProps) {
  const { projects } = useProjectStore();
  const [formData, setFormData] = useState({
    name: '',
    projectId: projectId || '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        projectId: task.projectId,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || '',
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const statusOptions = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const projectOptions = [
    { value: '', label: '案件を選択' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="プロダクト/案件名 *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        placeholder="HP作成"
      />
      {!projectId && (
        <Select
          label="案件 *"
          value={formData.projectId}
          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
          options={projectOptions}
          required
        />
      )}
      <Textarea
        label="タイトル"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="タスクのタイトル・詳細"
      />
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
