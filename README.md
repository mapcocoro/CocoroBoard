# CocoroBoard

個人事業・フリーランス向けの業務管理アプリケーション。顧客、案件、タスク、請求を一元管理できます。

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

- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **ルーティング**: React Router
- **日付処理**: date-fns

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

### 現在の仕組み

データは**ブラウザのLocalStorage**に保存されています。

- **メリット**: サーバー不要、即座に保存される
- **デメリット**: ブラウザ・デバイス間で共有できない、ブラウザのデータをクリアすると消える

### データの場所

ブラウザの開発者ツール → Application → Local Storage で確認できます。

キー:
- `cocoroboard_customers` - 顧客データ
- `cocoroboard_projects` - 案件データ
- `cocoroboard_tasks` - タスクデータ
- `cocoroboard_invoices` - 請求データ
- `cocoroboard_view_*` - 表示設定

### データのバックアップ

現時点ではエクスポート機能はありませんが、開発者ツールから手動でJSONをコピーできます。

```javascript
// ブラウザのコンソールで実行
const backup = {
  customers: JSON.parse(localStorage.getItem('cocoroboard_customers') || '[]'),
  projects: JSON.parse(localStorage.getItem('cocoroboard_projects') || '[]'),
  tasks: JSON.parse(localStorage.getItem('cocoroboard_tasks') || '[]'),
  invoices: JSON.parse(localStorage.getItem('cocoroboard_invoices') || '[]'),
};
console.log(JSON.stringify(backup, null, 2));
```

### 将来的なクラウド対応

ストレージ層は抽象化されているため、以下のような拡張が可能です：

1. **Supabase / Firebase**: リアルタイム同期、認証
2. **Google Drive API**: スプレッドシート連携
3. **自前のAPI**: Node.js + PostgreSQL等

`src/services/storage.ts` のインターフェースを実装すれば切り替え可能です。

## ディレクトリ構成

```
src/
├── components/
│   ├── common/         # 共通UIコンポーネント
│   ├── customers/      # 顧客関連
│   ├── projects/       # 案件関連
│   ├── tasks/          # タスク関連
│   ├── invoices/       # 請求関連
│   ├── import/         # インポート機能
│   └── layout/         # レイアウト
├── stores/             # Zustand ストア
├── services/           # データ層
└── types/              # 型定義
```

## 案件ステータス

| ステータス | 説明 |
|-----------|------|
| 相談中 | 初期相談段階 |
| 見積中 | 見積作成・提出中 |
| 制作中 | 実作業中 |
| 確認待ち | クライアント確認待ち |
| 完了 | 納品・公開完了 |
| 保守中 | 運用・保守フェーズ |
| 失注 | 受注に至らなかった |

## 案件ID体系

| 種別 | フォーマット | 例 |
|-----|-------------|-----|
| 受託案件 | YY-NN | 26-01, 26-02 |
| 自社プロダクト | Pro-NNN | Pro-001 |
| デモ・サンプル | Demo-NNN | Demo-001 |

## ライセンス

Private - 個人利用
