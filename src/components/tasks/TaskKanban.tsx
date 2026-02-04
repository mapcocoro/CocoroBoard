import { useState } from 'react';
import { Badge, ConfirmDialog } from '../common';
import type { Task, TaskStatus } from '../../types';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types';
import { format } from 'date-fns';

interface TaskKanbanProps {
  tasks: Task[];
  onMoveTask: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
}

const columns: TaskStatus[] = ['todo', 'in_progress', 'done'];

export function TaskKanban({ tasks, onMoveTask, onDeleteTask }: TaskKanbanProps) {
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
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

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onMoveTask(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      onDeleteTask(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-text-muted)]">
        タスクがありません
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[300px]">
        {columns.map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[240px] bg-[var(--color-bg-hover)] rounded-lg p-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
              {TASK_STATUS_LABELS[status]}
              <span className="ml-2 text-xs">({getTasksByStatus(status).length})</span>
            </h4>
            <div className="space-y-2">
              {getTasksByStatus(status).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className="bg-white border border-[var(--color-border)] rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-[var(--color-text)] flex-1">
                      {task.name}
                    </p>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="text-[var(--color-text-muted)] hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
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
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="タスクを削除"
        message={`「${deleteTarget?.name}」を削除しますか？`}
        confirmLabel="削除"
      />
    </>
  );
}
