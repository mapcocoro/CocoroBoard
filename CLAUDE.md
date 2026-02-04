# CLAUDE.md - CocoroBoard 開発ガイド

このファイルはClaude Codeがプロジェクトを理解するためのコンテキストを提供します。

## プロジェクト概要

CocoroBoard は個人事業向けの業務管理アプリです。NotionやGoogleスプレッドシートの代替として、顧客・案件・タスク・請求を一元管理します。

## よく使うコマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
```

## アーキテクチャ

### データ構造

```
Customer（顧客）
├── Project（案件）※1顧客に複数
│   ├── Task（タスク）※1案件に複数
│   └── Activity（活動ログ）※案件に埋め込み
└── Invoice（請求）※1顧客に複数、案件と紐づけ可能
```

### 状態管理（Zustand）

- `useCustomerStore` - 顧客のCRUD
- `useProjectStore` - 案件のCRUD、案件番号自動生成
- `useTaskStore` - タスクのCRUD、タスク番号自動生成
- `useInvoiceStore` - 請求のCRUD、請求番号自動生成

### データ永続化

`src/services/localStorage.ts` でLocalStorageに保存。キープレフィックスは `cocoroboard_`。

将来的にクラウド対応する場合は `src/services/storage.ts` のインターフェースを実装して差し替え。

## 型定義（src/types/index.ts）

### ProjectStatus（案件ステータス）
- `consulting` - 相談中
- `estimating` - 見積中
- `in_progress` - 制作中
- `waiting_review` - 確認待ち
- `completed` - 完了
- `maintenance` - 保守中
- `lost` - 失注

### ProjectType（案件種別）
- `client` - 受託案件（ID: 26-01形式）
- `internal` - 自社プロダクト（ID: Pro-001形式）
- `demo` - デモ・サンプル（ID: Demo-001形式）

### TaskStatus
- `todo` - 未着手
- `in_progress` - 進行中
- `done` - 完了

### InvoiceStatus
- `draft` - 下書き
- `sent` - 送付済
- `paid` - 入金済
- `overdue` - 期限超過
- `cancelled` - キャンセル

## 主要コンポーネント

| ファイル | 役割 |
|---------|------|
| `Dashboard.tsx` | トップページ、サマリー表示 |
| `ProjectList.tsx` | 案件一覧（カード/リスト表示切替、フィルター） |
| `ProjectDetail.tsx` | 案件詳細、タスク管理、活動ログ |
| `TaskKanban.tsx` | カンバン形式のタスク表示 |
| `ImportModal.tsx` | CSVインポート機能 |

## 共通コンポーネント（src/components/common/）

- `Button`, `Input`, `Select`, `Textarea` - フォーム部品
- `Modal`, `ConfirmDialog` - ダイアログ
- `Card`, `CardHeader`, `CardBody` - カードUI
- `Badge` - ステータス表示
- `EmptyState` - 空状態表示

## スタイリング

Tailwind CSSを使用。カスタムCSS変数：

```css
--color-primary: #2563eb;      /* プライマリカラー */
--color-text: #1f2937;         /* メインテキスト */
--color-text-muted: #6b7280;   /* 薄いテキスト */
--color-border: #e5e7eb;       /* ボーダー */
--color-bg-hover: #f9fafb;     /* ホバー背景 */
```

## CSVインポート形式

### 進行台帳（顧客・案件・請求）
必須列: `クライアント名`, `案件名`
オプション: `案件ID`, `ステータス`, `見積金額（税抜）`, `納期/公開予定日` 等

### 開発台帳（タスク）
必須列: `プロダクト/案件名` または `タイトル`
オプション: `開発ID`, `案件ID`, `状態`, `優先度`, `期限` 等

## 注意事項

- データはLocalStorageに保存（ブラウザごと、クリアで消える）
- 案件IDは種別ごとに自動採番（手動入力も可能）
- 活動ログは案件のactivitiesフィールドに配列で保存
- 進捗バーはタスク完了率から自動計算
