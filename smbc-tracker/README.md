# SMBC カード消費記録トラッカー

三井住友銀行カード（Olive フレキシブルペイ）の消費記録を Gmail から自動取得し、ローカルで可視化するツールです。

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | React 18 + TypeScript + Recharts |
| バックエンド | Node.js + TypeScript + Express |
| データベース | SQLite（Prisma ORM） |
| メール取得 | Gmail API（OAuth 2.0） |

---

## ディレクトリ構成

```
smbc-tracker/
├── backend/
│   ├── src/
│   │   ├── gmail/        # Gmail API 認証・取得
│   │   ├── parser/       # メール解析・カテゴリ判定
│   │   ├── db/           # Prisma クライアント
│   │   └── routes/       # REST API
│   ├── prisma/
│   │   └── schema.prisma
│   └── data/             # ← credentials.json と token.json をここに置く
├── frontend/
│   └── src/
│       ├── api/          # バックエンド API クライアント
│       ├── components/   # グラフ・テーブルコンポーネント
│       └── App.tsx
└── README.md
```

---

## Step 1 — Google Cloud OAuth 資格情報の作成

Gmail API を使うため、Google Cloud で OAuth クライアントを作成する必要があります。

### 1-1. Google Cloud プロジェクトを作成

1. [https://console.cloud.google.com/](https://console.cloud.google.com/) を開く
2. 画面上部の「プロジェクトを選択」→「新しいプロジェクト」
3. プロジェクト名（例：`smbc-tracker`）を入力して「作成」

### 1-2. Gmail API を有効化

1. 左メニュー「APIとサービス」→「ライブラリ」
2. 検索欄に `Gmail API` と入力
3. 「Gmail API」をクリック→「有効にする」

### 1-3. OAuth 同意画面を設定

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. ユーザーの種類：**外部** を選択→「作成」
3. アプリ名（例：`SMBC Tracker`）、サポートメールを入力→「保存して次へ」
4. スコープ画面：「スコープを追加または削除」→ `https://www.googleapis.com/auth/gmail.readonly` を追加
5. テストユーザー画面：「ユーザーを追加」→自分の Gmail アドレスを追加
6. 「保存して次へ」→完了

### 1-4. OAuth クライアント ID を作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類：**デスクトップアプリ**
4. 名前（例：`smbc-tracker-desktop`）→「作成」
5. ポップアップで「JSON をダウンロード」をクリック
6. ダウンロードしたファイルを `backend/data/credentials.json` にリネームして配置

```
backend/
└── data/
    └── credentials.json   ← ここに置く
```

---

## Step 2 — セットアップ

### バックエンド

```bash
cd backend
npm install
mkdir -p data
npx prisma migrate dev --name init
```

### フロントエンド

```bash
cd frontend
npm install
```

---

## Step 3 — 初回 Gmail 認証

```bash
cd backend
npm run dev
```

起動後、別ターミナルで：

```bash
curl -X POST http://localhost:3001/api/sync
```

初回はターミナルに認証 URL が表示されます：

```
=== Gmail Authorization Required ===
Open this URL in your browser:

https://accounts.google.com/o/oauth2/auth?...

Authorization code:
```

1. URL をブラウザで開く
2. Gmail アカウントでログイン・許可
3. 表示されたコードをターミナルに貼り付けて Enter

認証後、`backend/data/token.json` が保存され、次回から自動ログインになります。

---

## Step 4 — 起動

### バックエンド（ポート 3001）

```bash
cd backend
npm run dev
```

### フロントエンド（ポート 5173）

```bash
cd frontend
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開く。

---

## 使い方

### メール同期

画面右上の「メール同期」ボタンをクリックすると、Gmail から全件取得してデータベースに保存します（重複は自動スキップ）。

### グラフ操作

| 操作 | 効果 |
|------|------|
| 棒グラフの月をクリック | その月のデータに絞り込み |
| ツリーマップのカテゴリをクリック | そのカテゴリに絞り込み |

### カテゴリ編集

取引テーブルのカテゴリ欄をクリックするとドロップダウンが開き、手動で変更できます。

---

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/transactions` | 取引一覧（ページング・絞込） |
| PATCH | `/api/transactions/:id` | カテゴリ手動変更 |
| GET | `/api/transactions/stats/monthly` | 月別集計 |
| GET | `/api/transactions/stats/category` | カテゴリ別集計 |
| POST | `/api/sync` | Gmail から全件同期 |

---

## カテゴリ自動分類ルール

商户名（英大文字）のキーワードマッチングで判定します。`backend/src/parser/categoryMatcher.ts` を編集して追加・変更できます。

| カテゴリ | 代表キーワード |
|---------|--------------|
| コンビニ | SEVEN-ELEVEN, LAWSON, FAMILYMART |
| 飲食・レストラン | MCDONALDS, KFC, YOSHINOYA |
| カフェ | STARBUCKS, DOUTOR, TULLY |
| 交通 | SUICA, JR, TAXI, UBER |
| ショッピング | AMAZON, RAKUTEN, UNIQLO |
| エンタメ | NETFLIX, SPOTIFY, APPLE |
| 未分類 | 上記に該当しない場合 |

---

## License

MIT
