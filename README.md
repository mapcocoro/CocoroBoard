# CocoroBoard

個人事業・フリーランス向けの業務管理アプリケーション。顧客、案件、タスク、請求を一元管理できます。

## 公開URL

https://mapcocoro.github.io/CocoroBoard/

## 概要

NotionやGoogle スプレッドシートで管理していた業務データを、自分専用にカスタマイズされた形で管理するために開発しました。

### 主な機能

- **顧客管理**: 顧客情報の登録・編集・削除
- **案件管理**: 案件の進捗管理、活動ログ、関連情報の一元管理
- **タスク管理**: カンバン形式でのタスク管理、案件との紐づけ
- **請求管理**: 見積・請求の管理、入金ステータス追跡
- **ダッシュボード**: 進行中案件、直近タスク、売上サマリーの一覧表示
- **CSVインポート**: 既存のスプレッドシートからのデータ移行

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 18 + TypeScript |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS |
| 状態管理 | Zustand |
| ルーティング | React Router |
| データベース | **Supabase (PostgreSQL)** |
| ホスティング | GitHub Pages |
| 日付処理 | date-fns |

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## データ保存について

### Supabase（クラウドデータベース）

データは **Supabase (PostgreSQL)** に保存されています。

**メリット:**
- ブラウザを変えてもデータが消えない
- 複数デバイスから同じデータにアクセス可能
- Supabaseダッシュボードからデータの確認・編集が可能

**Supabaseプロジェクト:**
- URL: `https://mwvewkjxlvciyrumczzr.supabase.co`
- ダッシュボード: Supabase → Table Editor でデータ確認

### テーブル構成

| テーブル | 説明 |
|---------|------|
| `customers` | 顧客データ |
| `projects` | 案件データ（活動ログはJSONB） |
| `tasks` | タスクデータ |
| `invoices` | 請求データ |

### 環境変数（オプション）

Supabaseの接続情報はコードに埋め込まれていますが、環境変数で上書き可能です：

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## ディレクトリ構成

```
src/
├── components/
│   ├── common/         # 共通UIコンポーネント（Button, Modal等）
│   ├── customers/      # 顧客関連
│   ├── projects/       # 案件関連
│   ├── tasks/          # タスク関連
│   ├── invoices/       # 請求関連
│   ├── import/         # CSVインポート機能
│   └── layout/         # Sidebar, Header等
├── stores/             # Zustand ストア（Supabase連携）
├── services/
│   ├── supabase.ts     # Supabaseクライアント設定
│   ├── storage.ts      # ストレージインターフェース
│   └── localStorage.ts # LocalStorage実装（未使用）
└── types/              # TypeScript型定義
```

## 案件ステータス

| ステータス | 英語キー | 説明 |
|-----------|---------|------|
| 相談中 | `consulting` | 初期相談段階 |
| 見積中 | `estimating` | 見積作成・提出中 |
| 制作中 | `in_progress` | 実作業中 |
| 確認待ち | `waiting_review` | クライアント確認待ち |
| 完了 | `completed` | 納品・公開完了 |
| 保守中 | `maintenance` | 運用・保守フェーズ |
| 失注 | `lost` | 受注に至らなかった |

## 案件ID体系

| 種別 | フォーマット | 例 |
|-----|-------------|-----|
| 受託案件 | YY-NN | 26-01, 26-02 |
| 自社プロダクト | Pro-NNN | Pro-001 |
| デモ・サンプル | Demo-NNN | Demo-001 |

## デプロイ

GitHub Actionsで自動デプロイ：
- `main`ブランチにpush → 自動でビルド → GitHub Pagesに公開

手動デプロイ：
```bash
git push origin main
```

## ライセンス

Private - 個人利用
