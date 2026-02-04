import { useState } from 'react';
import { Modal, Button, Select } from '../common';
import { useCustomerStore, useProjectStore, useTaskStore, useInvoiceStore } from '../../stores';
import type { ProjectStatus, ProjectType, TaskStatus, TaskPriority, InvoiceStatus } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportType = 'shinko' | 'kaihatsu' | 'product';

// 進行台帳の行
interface ShinkoRow {
  案件ID: string;
  クライアント名: string;
  案件名: string;
  種別: string;
  ステータス: string;
  優先度: string;
  '開発相談AI URL': string;
  次アクション: string;
  次アクション期限: string;
  '納期/公開予定日': string;
  '見積金額（税抜）': string;
  請求ステータス: string;
  連絡先: string;
  請求日: string;
  入金予定日: string;
  入金日: string;
  最終連絡日: string;
  催促予定日: string;
  フォルダURL: string;
  '参考URL/デザインURL': string;
  検証用URL: string;
  公開URL: string;
  メモ: string;
  ドメイン: string;
}

// 開発台帳の行
interface KaihatsuRow {
  開発ID: string;
  案件ID: string;
  進行台帳へ: string;
  'プロダクト/案件名': string;
  タイトル: string;
  種別: string;
  状態: string;
  優先度: string;
  開始日: string;
  進行メモ: string;
  期限: string;
  'メモ/リンク': string;
  完了日: string;
  ステイタスメモ: string;
}

// プロダクト管理の行
interface ProductRow {
  カテゴリ: string;
  プロダクト: string;
  リンク: string;
  格納場所: string;
  github: string;
  デプロイ先: string;
  CMS: string;
  Datebase: string;
}

function parseCSV<T>(text: string): T[] {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows: T[] = [];

  let i = 1;
  while (i < lines.length) {
    let line = lines[i];

    while (line && (line.split('"').length - 1) % 2 !== 0 && i + 1 < lines.length) {
      i++;
      line += '\n' + lines[i];
    }

    if (line.trim()) {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row as T);
    }
    i++;
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function mapProjectStatus(status: string): ProjectStatus {
  const statusMap: Record<string, ProjectStatus> = {
    '相談中': 'consulting',
    '見積中': 'estimating',
    '制作中': 'in_progress',
    '確認待ち': 'waiting_review',
    '完了': 'completed',
    '保守中': 'maintenance',
    '失注': 'lost',
    // 旧ステータスの互換性
    '保留': 'consulting',
    '中止': 'lost',
  };
  return statusMap[status] || 'consulting';
}

function mapTaskStatus(status: string, completedDate: string): TaskStatus {
  if (completedDate || status === '完了') return 'done';
  const statusMap: Record<string, TaskStatus> = {
    '進行中': 'in_progress',
    '確認待ち': 'in_progress',
    '未着手': 'todo',
  };
  return statusMap[status] || 'todo';
}

function mapTaskPriority(priority: string): TaskPriority {
  const priorityMap: Record<string, TaskPriority> = {
    '高': 'high',
    '中': 'medium',
    '低': 'low',
  };
  return priorityMap[priority] || 'medium';
}

function mapInvoiceStatus(status: string, paidDate: string): InvoiceStatus {
  if (paidDate) return 'paid';
  const statusMap: Record<string, InvoiceStatus> = {
    '未請求': 'draft',
    '請求済': 'sent',
    '入金済': 'paid',
    '期限超過': 'overdue',
  };
  return statusMap[status] || 'draft';
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  return parseInt(amountStr.replace(/[¥,]/g, ''), 10) || 0;
}

function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // 2026/01/30 or 2025/12/20 形式
  const match = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 12/01 形式（年なし）
  const shortMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (shortMatch) {
    const [, month, day] = shortMatch;
    const year = new Date().getFullYear();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return undefined;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [importType, setImportType] = useState<ImportType>('shinko');
  const [preview, setPreview] = useState<unknown[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ customers: number; projects: number; tasks: number; invoices: number } | null>(null);

  const { customers, addCustomer } = useCustomerStore();
  const { projects, addProject } = useProjectStore();
  const { addTask } = useTaskStore();
  const { addInvoice, generateInvoiceNumber } = useInvoiceStore();

  const importTypeOptions = [
    { value: 'shinko', label: '進行台帳（顧客・案件・請求）' },
    { value: 'kaihatsu', label: '開発台帳（タスク）' },
    { value: 'product', label: 'プロダクト管理（案件）' },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const text = await selectedFile.text();

    if (importType === 'shinko') {
      const rows = parseCSV<ShinkoRow>(text);
      setPreview(rows.filter(row => row.クライアント名 && row.案件名));
    } else if (importType === 'kaihatsu') {
      const rows = parseCSV<KaihatsuRow>(text);
      setPreview(rows.filter(row => row['プロダクト/案件名'] || row.タイトル));
    } else {
      const rows = parseCSV<ProductRow>(text);
      setPreview(rows.filter(row => row.プロダクト));
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    let customerCount = 0;
    let projectCount = 0;
    let taskCount = 0;
    let invoiceCount = 0;

    // 顧客マップ（名前 → ID）
    const customerMap = new Map<string, string>();
    customers.forEach(c => customerMap.set(c.name, c.id));

    // 案件マップ（案件ID → projectId）進行台帳の案件IDとの紐づけ用
    const projectMap = new Map<string, string>();
    projects.forEach(p => {
      // 説明に案件IDが含まれていれば紐づけ
      if (p.description) {
        const match = p.description.match(/案件ID:\s*(\S+)/);
        if (match) projectMap.set(match[1], p.id);
      }
    });

    if (importType === 'shinko') {
      for (const row of preview as ShinkoRow[]) {
        // 顧客を作成または取得
        let customerId = customerMap.get(row.クライアント名);
        if (!customerId) {
          const newCustomer = await addCustomer({
            name: row.クライアント名,
            email: row.連絡先 || undefined,
            memo: row.ドメイン ? `ドメイン情報:\n${row.ドメイン}` : undefined,
          });
          customerId = newCustomer.id;
          customerMap.set(row.クライアント名, customerId);
          customerCount++;
        }

        // 案件を作成
        const description = [
          row.種別 && `種別: ${row.種別}`,
          row.次アクション && `次アクション: ${row.次アクション}`,
          row['参考URL/デザインURL'] && `参考URL: ${row['参考URL/デザインURL']}`,
          row.メモ && `メモ: ${row.メモ}`,
        ].filter(Boolean).join('\n\n');

        const project = await addProject({
          customerId,
          name: row.案件名 || `${row.クライアント名}案件`,
          description: description || undefined,
          type: 'client' as ProjectType,
          status: mapProjectStatus(row.ステータス),
          dueDate: parseDate(row['納期/公開予定日']),
          budget: parseAmount(row['見積金額（税抜）']) || undefined,
          // 追加フィールド
          projectNumber: row.案件ID || undefined,
          domainInfo: row.ドメイン || undefined,
          aiConsultUrl: row['開発相談AI URL'] || undefined,
          meetingFolder: row.フォルダURL || undefined,
          stagingUrl: row.検証用URL || undefined,
          productionUrl: row.公開URL || undefined,
        });
        projectCount++;

        // 案件マップに追加
        if (row.案件ID) {
          projectMap.set(row.案件ID, project.id);
        }

        // 請求を作成（金額がある場合）
        const amount = parseAmount(row['見積金額（税抜）']);
        if (amount > 0) {
          await addInvoice({
            customerId,
            projectId: project.id,
            invoiceNumber: row.案件ID || generateInvoiceNumber(),
            amount,
            issueDate: parseDate(row.請求日) || new Date().toISOString().split('T')[0],
            dueDate: parseDate(row.入金予定日),
            paidDate: parseDate(row.入金日),
            status: mapInvoiceStatus(row.請求ステータス, row.入金日),
          });
          invoiceCount++;
        }
      }
    } else if (importType === 'kaihatsu') {
      // 「自社開発」顧客を作成または取得
      let selfCustomerId = customerMap.get('自社開発');
      if (!selfCustomerId) {
        const newCustomer = await addCustomer({ name: '自社開発' });
        selfCustomerId = newCustomer.id;
        customerMap.set('自社開発', selfCustomerId);
        customerCount++;
      }

      // 「自社開発」案件を作成または取得（案件IDがないタスク用）
      let selfProjectId = projects.find(p => p.name === '自社開発タスク')?.id;
      if (!selfProjectId) {
        const newProject = await addProject({
          customerId: selfCustomerId,
          name: '自社開発タスク',
          type: 'internal' as ProjectType,
          status: 'in_progress',
        });
        selfProjectId = newProject.id;
        projectCount++;
      }

      for (const row of preview as KaihatsuRow[]) {
        // 案件IDから紐づけ先を特定
        let projectId = selfProjectId!;
        if (row.案件ID && projectMap.has(row.案件ID)) {
          projectId = projectMap.get(row.案件ID)!;
        }

        const description = [
          row.タイトル && `タイトル: ${row.タイトル}`,
          row.種別 && `種別: ${row.種別}`,
          row.進行メモ && `進行メモ: ${row.進行メモ}`,
          row['メモ/リンク'] && `メモ/リンク: ${row['メモ/リンク']}`,
          row.ステイタスメモ && `ステイタスメモ: ${row.ステイタスメモ}`,
        ].filter(Boolean).join('\n\n');

        await addTask({
          projectId,
          name: row['プロダクト/案件名'] || row.タイトル || '無題タスク',
          description: description || undefined,
          status: mapTaskStatus(row.状態, row.完了日),
          priority: mapTaskPriority(row.優先度),
          dueDate: parseDate(row.期限),
          // 開発IDをタスクIDとして使用
          taskNumber: row.開発ID || undefined,
        });
        taskCount++;
      }
    } else {
      // プロダクト管理 → カテゴリを顧客、プロダクトを案件として登録
      for (const row of preview as ProductRow[]) {
        const category = row.カテゴリ || '未分類';

        // Clientカテゴリはスキップ（進行台帳で管理されるため）
        if (category.toLowerCase() === 'client') {
          continue;
        }

        // カテゴリから顧客を作成または取得
        let customerId = customerMap.get(category);
        if (!customerId) {
          const newCustomer = await addCustomer({ name: category });
          customerId = newCustomer.id;
          customerMap.set(category, customerId);
          customerCount++;
        }

        // カテゴリに基づいて種別を決定
        let projectType: ProjectType = 'internal';
        if (category.toLowerCase().startsWith('demo')) {
          projectType = 'demo';
        } else if (category.toLowerCase() === 'client') {
          projectType = 'client';
        }

        const description = [
          row.リンク && `URL: ${row.リンク}`,
          row.格納場所 && `格納場所: ${row.格納場所}`,
          row.github && `GitHub: ${row.github}`,
          row.デプロイ先 && `デプロイ先: ${row.デプロイ先}`,
          row.CMS && `CMS: ${row.CMS}`,
          row.Datebase && `Database: ${row.Datebase}`,
        ].filter(Boolean).join('\n\n');

        await addProject({
          customerId,
          name: row.プロダクト,
          description: description || undefined,
          type: projectType,
          status: 'completed',
        });
        projectCount++;
      }
    }

    setResult({ customers: customerCount, projects: projectCount, tasks: taskCount, invoices: invoiceCount });
    setImporting(false);
  };

  const handleClose = () => {
    setPreview([]);
    setResult(null);
    onClose();
  };

  const renderPreview = () => {
    if (preview.length === 0) return null;

    if (importType === 'shinko') {
      const rows = preview as ShinkoRow[];
      return (
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-hover)] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left">クライアント</th>
              <th className="px-2 py-1 text-left">案件名</th>
              <th className="px-2 py-1 text-left">ステータス</th>
              <th className="px-2 py-1 text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--color-border)]">
                <td className="px-2 py-1">{row.クライアント名}</td>
                <td className="px-2 py-1">{row.案件名}</td>
                <td className="px-2 py-1">{row.ステータス}</td>
                <td className="px-2 py-1 text-right">{row['見積金額（税抜）']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (importType === 'kaihatsu') {
      const rows = preview as KaihatsuRow[];
      return (
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-hover)] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left">タイトル</th>
              <th className="px-2 py-1 text-left">案件ID</th>
              <th className="px-2 py-1 text-left">状態</th>
              <th className="px-2 py-1 text-left">優先度</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--color-border)]">
                <td className="px-2 py-1">{row.タイトル || row['プロダクト/案件名']}</td>
                <td className="px-2 py-1">{row.案件ID || '-'}</td>
                <td className="px-2 py-1">{row.状態}</td>
                <td className="px-2 py-1">{row.優先度}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      const rows = preview as ProductRow[];
      return (
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-hover)] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left">カテゴリ</th>
              <th className="px-2 py-1 text-left">プロダクト</th>
              <th className="px-2 py-1 text-left">GitHub</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--color-border)]">
                <td className="px-2 py-1">{row.カテゴリ || '未分類'}</td>
                <td className="px-2 py-1">{row.プロダクト}</td>
                <td className="px-2 py-1 truncate max-w-[150px]">{row.github || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="データインポート"
      footer={
        result ? (
          <Button onClick={handleClose}>閉じる</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={handleImport} disabled={preview.length === 0 || importing}>
              {importing ? 'インポート中...' : `${preview.length}件をインポート`}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="text-center py-4">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-lg font-medium mb-2">インポート完了</p>
          <div className="text-sm text-[var(--color-text-muted)] space-y-1">
            {result.customers > 0 && <p>顧客: {result.customers}件 追加</p>}
            {result.projects > 0 && <p>案件: {result.projects}件 追加</p>}
            {result.tasks > 0 && <p>タスク: {result.tasks}件 追加</p>}
            {result.invoices > 0 && <p>請求: {result.invoices}件 追加</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Select
            label="インポート種別"
            value={importType}
            onChange={(e) => {
              setImportType(e.target.value as ImportType);
              setPreview([]);
            }}
            options={importTypeOptions}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              CSVファイルを選択
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-[var(--color-text-muted)]
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-[var(--color-primary)] file:text-white
                hover:file:bg-blue-600
                file:cursor-pointer"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] mb-2">
                プレビュー（{preview.length}件）
              </p>
              <div className="max-h-60 overflow-auto border border-[var(--color-border)] rounded-md">
                {renderPreview()}
              </div>
            </div>
          )}

          <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] p-3 rounded-md">
            {importType === 'shinko' && (
              <>
                <p className="font-medium mb-1">進行台帳</p>
                <p>・クライアント名から顧客を自動作成</p>
                <p>・案件情報は説明に統合</p>
                <p>・見積金額がある場合は請求も作成</p>
              </>
            )}
            {importType === 'kaihatsu' && (
              <>
                <p className="font-medium mb-1">開発台帳</p>
                <p>・タスクとしてインポート</p>
                <p>・案件IDがあれば進行台帳の案件に紐づけ</p>
                <p>・案件IDがなければ「自社開発タスク」に紐づけ</p>
              </>
            )}
            {importType === 'product' && (
              <>
                <p className="font-medium mb-1">プロダクト管理</p>
                <p>・カテゴリを顧客として作成</p>
                <p>・プロダクトを案件として作成</p>
                <p>・GitHub、URL等は説明に統合</p>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
