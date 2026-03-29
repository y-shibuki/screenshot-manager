# my-app

Windowsのスクリーンショット管理Webアプリ。OneDriveフォルダ内の画像をサムネイル一覧で確認・削除・プレビューできる。WSL2上で動作し、ブラウザからアクセスする。

## 概要

- **用途**: ローカル専用（認証なし、localhost のみ）。仕事用PCでスクリーンショットを整理するツール。
- **バックエンド**: FastAPI + Uvicorn（Python）
- **フロントエンド**: React 19 + Vite + TypeScript
- **UI**: shadcn/ui (new-york) + Tailwind CSS 4
- **DB**: SQLite（SQLAlchemy + Alembic）。設定（フォルダパス）を保存。
- **ファイル削除**: `send2trash` でゴミ箱へ移動（物理削除しない）
- **サムネイル**: Pillow で生成、`~/.cache/my-app/thumbs/` にキャッシュ
- **パッケージ管理**: uv（Python）、npm（Node.js）

## アーキテクチャ

FastAPI が API 提供と静的ファイル配信を担当。開発時は Vite dev server (HMR) + FastAPI を並行起動し、Vite プロキシで `/api` を転送。本番時は Vite ビルド成果物を FastAPI で静的配信し、ポート5001のみで完結。

## 構成

```
my-app/
├── backend/                      # Python/FastAPI バックエンド
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPIアプリ定義・静的ファイル配信
│   │   ├── config.py             # 設定（ポート、DBパス、キャッシュパス）
│   │   ├── database.py           # SQLAlchemy async engine/session
│   │   ├── models.py             # SQLAlchemy モデル定義
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── settings.py       # /api/settings エンドポイント
│   │       └── images.py         # /api/images エンドポイント
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/             # マイグレーションファイル
│   ├── alembic.ini
│   └── pyproject.toml            # uv/Python依存定義
├── src/                          # React フロントエンド
│   ├── components/
│   │   ├── ui/                   # shadcn/uiコンポーネント
│   │   ├── FolderSetup.tsx       # フォルダパス入力画面
│   │   ├── ImageGrid.tsx         # サムネイルグリッド（メイン画面）
│   │   ├── ImageCard.tsx         # サムネイルカード（削除ボタン付き）
│   │   └── ImagePreview.tsx      # 拡大プレビュー（lightbox、キーボード操作対応）
│   ├── hooks/
│   │   ├── useSettings.ts        # fetch経由で設定管理
│   │   └── useImages.ts          # fetch経由で画像一覧・削除
│   ├── lib/
│   │   ├── utils.ts              # cn() ユーティリティ
│   │   └── api.ts                # APIクライアント（fetch wrapper）
│   └── types/index.ts            # ImageFile 型定義
├── index.html
├── package.json
├── vite.config.ts                # /api → FastAPI プロキシ設定
├── components.json               # shadcn/ui設定
└── Taskfile.yml
```

## コマンド

```bash
task dev          # Vite dev server + Uvicorn を並行起動（開発用）
task start        # Uvicorn のみ起動（本番用、ビルド済み前提）
task build        # Vite でフロントエンドをビルド
task install      # Python + Node.js の依存を一括インストール
task fe:install   # npm install
task be:install   # uv sync
task fe:lint      # ESLint を実行
task be:lint      # ruff check を実行
task be:fmt       # ruff format を実行
task be:test      # pytest を実行
task lint         # fe:lint + be:lint
task test         # be:test
task db:migrate   # Alembic マイグレーション実行
task db:revision  # Alembic リビジョン作成
```

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/settings/{key}` | 設定値を取得 |
| PUT | `/api/settings/{key}` | 設定値を保存 |
| GET | `/api/images` | 画像一覧を取得（query: `folder_path`、更新日時降順） |
| DELETE | `/api/images` | 画像をゴミ箱へ移動（body: `{ "path": "..." }`） |
| GET | `/api/images/thumb/{path:path}` | サムネイル画像を取得 |
| GET | `/api/images/full/{path:path}` | 原寸画像を取得 |

## ポート番号

| 用途 | ポート |
|------|--------|
| FastAPI（常時） | 5001 |
| Vite dev server（開発時のみ） | 5173 |

## 開発環境セットアップ

```bash
# Node.js（nvm経由）
source ~/.nvm/nvm.sh
nvm install --lts

# Python（uv経由）
# uvが未インストールの場合: curl -LsSf https://astral.sh/uv/install.sh | sh

# 依存インストール
task install

# DBマイグレーション
task db:migrate

# 起動（ブラウザで http://localhost:5173 を開く）
task dev
```
