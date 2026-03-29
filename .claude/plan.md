---
project: my-app
status: planning
architecture: fastapi-react
---

# 設計書: my-app（FastAPI + React版）

## Context

Windowsのスクリーンショット（OneDriveフォルダに保存）を整理するためのローカル専用Webアプリ。
WSL2上で動作し、ブラウザからサムネイル一覧の確認・削除・プレビューを行う。

Tauri v2（Rust + WebView）構成からFastAPI + React（ブラウザ動作）構成へ完全に置き換える。
理由: Tauriのビルド環境の複雑さを排除し、ブラウザベースで手軽に使えるようにする。

## 要件

### 機能要件

- 監視対象フォルダ（OneDrive内）のパスをUI上で設定・変更できる
- フォルダ内の画像ファイル（png, jpg, jpeg, gif, bmp, webp）をサムネイルグリッドで一覧表示する
- 画像は更新日時の降順で表示する
- サムネイルをクリックするとフルサイズのプレビュー（lightbox）を表示する
- プレビュー画面でキーボード操作（左右キーで前後、Escで閉じる）ができる
- 画像を選択してゴミ箱へ移動（物理削除しない）できる
- フォルダパス設定はアプリ再起動後も保持される

### 非機能要件

| 属性 | 要件 | 備考 |
|------|------|------|
| 可用性 | ローカル専用のため高可用性は不要 | 手動起動 → 将来デーモン化 |
| レイテンシ | サムネイル一覧表示 < 2秒（100枚程度） | サムネイルキャッシュで達成 |
| セキュリティ | localhost のみバインド、認証なし | ローカル専用のため |
| データ整合性 | ファイルシステムが正、DBはキャッシュ | スキャン時に同期 |

## アーキテクチャ

```
[Browser]
   │ HTTP (localhost:5001)
   ▼
[FastAPI]
   ├── /api/settings/*      → [SQLite] (設定永続化)
   ├── /api/images/scan      → [ファイルシステム] (/mnt/c/... OneDrive)
   ├── /api/images/delete    → [send2trash] (ゴミ箱移動)
   ├── /api/images/thumb/*   → [サムネイルキャッシュ] (~/.cache/my-app/thumbs/)
   ├── /api/images/full/*    → [ファイルシステム] (原寸画像配信)
   └── /* (静的ファイル)      → [Viteビルド成果物] (本番時)
```

### ポート番号

| 用途 | ポート | 備考 |
|------|--------|------|
| FastAPI（本番・開発共通） | **5001** | 5173/8000/8080を避けた |
| Vite dev server（開発時のみ） | **5173** | Viteデフォルト。`/api` はFastAPIへプロキシ |

本番時は FastAPI が Vite ビルド成果物を静的配信するため、ポート5001のみで完結する。
開発時は Vite dev server (5173) をブラウザで開き、`/api` へのリクエストを FastAPI (5001) にプロキシする。

## 技術スタック

| レイヤー | 選定技術 | 選定理由 | 代替候補 | 見送り理由 |
|----------|----------|----------|----------|------------|
| バックエンド | FastAPI | 非同期対応、型ヒント、軽量 | Flask | 非同期サポートが弱い |
| サーバー | Uvicorn | FastAPI標準、ASGI | Gunicorn | WSL単一ユーザーにはUvicornで十分 |
| DB | SQLite + aiosqlite | ローカル専用、セットアップ不要 | PostgreSQL | オーバースペック |
| マイグレーション | Alembic | SQLAlchemy連携、標準的 | 手動SQL | 変更追跡が困難 |
| ORM | SQLAlchemy 2.0 (async) | Alembicとの親和性 | 直接SQL | マイグレーションツールとの統合 |
| サムネイル生成 | Pillow | Python画像処理の定番 | - | - |
| ゴミ箱移動 | send2trash | クロスプラットフォーム対応 | os.remove | 物理削除は要件外 |
| パッケージ管理 | uv | 高速、lockfile対応 | pip/poetry | uvの方が高速 |
| フロントエンド | React 19 + Vite + TypeScript | 既存資産を活用 | - | - |
| UI | shadcn/ui + Tailwind CSS 4 | 既存資産を活用 | - | - |

## ディレクトリ構造

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
│   │   └── versions/
│   │       └── 0001_init.py      # 初期マイグレーション
│   ├── alembic.ini
│   └── pyproject.toml            # uv/Python依存定義
├── src/                          # React フロントエンド（既存を改修）
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui コンポーネント（既存流用）
│   │   ├── FolderSetup.tsx       # フォルダパス入力画面
│   │   ├── ImageGrid.tsx         # サムネイルグリッド
│   │   ├── ImageCard.tsx         # サムネイルカード
│   │   └── ImagePreview.tsx      # 拡大プレビュー（lightbox）
│   ├── hooks/
│   │   ├── useSettings.ts        # fetch経由で設定管理
│   │   └── useImages.ts          # fetch経由で画像一覧・削除
│   ├── lib/
│   │   ├── utils.ts              # cn() ユーティリティ
│   │   └── api.ts                # APIクライアント（fetch wrapper）
│   └── types/
│       └── index.ts              # 型定義
├── index.html
├── package.json
├── vite.config.ts                # proxyで /api → FastAPI に転送
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── components.json               # shadcn/ui設定
├── Taskfile.yml
└── .gitignore
```

## APIエンドポイント一覧

### 設定 API

| メソッド | パス | 説明 | リクエスト | レスポンス |
|----------|------|------|------------|------------|
| GET | `/api/settings/{key}` | 設定値を取得 | - | `{ "key": "...", "value": "..." }` |
| PUT | `/api/settings/{key}` | 設定値を保存 | `{ "value": "..." }` | `{ "key": "...", "value": "..." }` |

### 画像 API

| メソッド | パス | 説明 | リクエスト | レスポンス |
|----------|------|------|------------|------------|
| GET | `/api/images` | 画像一覧を取得（更新日時降順） | query: `folder_path` | `{ "images": [ImageFile, ...] }` |
| DELETE | `/api/images` | 画像をゴミ箱へ移動 | `{ "path": "..." }` | `{ "success": true }` |
| GET | `/api/images/thumb/{path:path}` | サムネイル画像を取得 | - | image/jpeg (バイナリ) |
| GET | `/api/images/full/{path:path}` | 原寸画像を取得 | - | image/* (バイナリ) |

### ヘルスチェック

| メソッド | パス | 説明 | レスポンス |
|----------|------|------|------------|
| GET | `/api/health` | サーバー稼働確認 | `{ "status": "ok" }` |

### ImageFile型

```typescript
interface ImageFile {
  path: string;        // フルパス
  name: string;        // ファイル名
  modified_at: string; // ISO8601形式の更新日時
  size: number;        // バイト数
  thumb_url: string;   // /api/images/thumb/... のURL
  full_url: string;    // /api/images/full/... のURL
}
```

## DBスキーマ（SQLite、Alembic管理）

### settings テーブル

```sql
CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

用途: `folder_path` などアプリ設定の永続化。

### 将来のimagesテーブル（初期リリースでは不要）

タグ機能などを追加する場合に備えてAlembicで管理する。初期マイグレーションには `settings` テーブルのみ含める。

## サムネイルキャッシュ戦略

- **キャッシュ先**: `~/.cache/my-app/thumbs/`
- **キャッシュキー**: 元ファイルの絶対パスをSHA256ハッシュ化した値 + `.jpg`
- **サムネイルサイズ**: 長辺300px（アスペクト比維持）、JPEG品質80
- **キャッシュ無効化**: 元ファイルの`mtime`をチェックし、変更があれば再生成
- **生成タイミング**: `/api/images/thumb/{path}` へのリクエスト時にオンデマンド生成
- **キャッシュ管理**: `mtime`比較のみ。明示的な削除機構は初期リリースでは不要

```python
# キャッシュパスの生成ロジック（概念）
cache_key = hashlib.sha256(abs_path.encode()).hexdigest()
cache_path = CACHE_DIR / f"{cache_key}.jpg"

if cache_path.exists() and cache_path.stat().st_mtime >= source_path.stat().st_mtime:
    return cache_path  # キャッシュヒット

# キャッシュミス → 生成
img = Image.open(source_path)
img.thumbnail((300, 300))
img.save(cache_path, "JPEG", quality=80)
```

## デーモン化の方針

### Phase 1: 手動起動（初期リリース）

```bash
task start  # Uvicornを起動、Ctrl+Cで停止
```

### Phase 2: systemd user service（将来）

`~/.config/systemd/user/my-app.service` に配置する。

```ini
[Unit]
Description=my-app screenshot manager
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/shibuki/work/my-app
ExecStart=/home/shibuki/work/my-app/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5001
Restart=on-failure
RestartSec=5
Environment=PYTHONPATH=/home/shibuki/work/my-app/backend

[Install]
WantedBy=default.target
```

有効化手順:

```bash
# unit fileを配置
mkdir -p ~/.config/systemd/user
cp my-app.service ~/.config/systemd/user/

# 有効化・起動
systemctl --user daemon-reload
systemctl --user enable my-app
systemctl --user start my-app

# 状態確認
systemctl --user status my-app

# ログ確認
journalctl --user -u my-app -f
```

## 開発時・本番時の起動フロー

### 開発時

```
task dev
  ├── Vite dev server (localhost:5173) ... HMR有効、/api は FastAPI にプロキシ
  └── Uvicorn (localhost:5001) ... --reload で自動リスタート
```

ブラウザでは `http://localhost:5173` を開く。
Viteの設定で `/api` へのリクエストを `http://localhost:5001` に転送する。

### 本番時

```
task build   # Viteビルド → dist/ に出力
task start   # Uvicorn起動、dist/ を静的配信
```

ブラウザでは `http://localhost:5001` を開く。
FastAPI が `/api/*` のリクエストを処理し、それ以外は `dist/` の静的ファイルを返す。

## Taskfile.yml タスク一覧

| タスク | 説明 |
|--------|------|
| `task dev` | Vite dev server + Uvicorn を並行起動（開発用） |
| `task start` | Uvicornのみ起動（本番用、Viteビルド済み前提） |
| `task build` | Viteでフロントエンドをビルド |
| `task be:install` | uv sync でPython依存をインストール |
| `task fe:install` | npm install でNode依存をインストール |
| `task install` | be:install + fe:install |
| `task fe:lint` | ESLintを実行 |
| `task be:lint` | ruff checkを実行 |
| `task be:fmt` | ruff formatを実行 |
| `task be:test` | pytestを実行 |
| `task lint` | fe:lint + be:lint |
| `task test` | be:test |
| `task db:migrate` | Alembicマイグレーション実行 |
| `task db:revision` | Alembicリビジョン作成 |

## ADR一覧

### ADR-001: Tauri v2 から FastAPI + React（ブラウザ）への移行

#### 状況
Tauri v2（Rust + WebView）で構築していたが、ビルド環境の複雑さ（Rust toolchain + WebView2依存）と開発サイクルの遅さが課題だった。

#### 決定
FastAPI（Python）をバックエンド、React（Vite）をフロントエンドとし、ブラウザで動作するWebアプリに変更する。

#### 理由
- Pythonの方がチームの習熟度が高い
- ブラウザベースの方が開発・デバッグが容易
- ローカル専用アプリのためデスクトップネイティブの利点（トレイアイコン等）は不要
- Tauri固有のビルドエラーやWebView互換性問題から解放される

#### 結果
- Rustコードは全て破棄、Pythonで再実装
- フロントエンドはTauri APIコール部分をfetch APIに差し替え
- WebViewではなくブラウザが必要（タブを開く操作が必要）
- ネイティブファイルダイアログは使えない → テキスト入力でフォルダパスを指定

### ADR-002: サムネイルをサーバーサイドで生成しファイルキャッシュする

#### 状況
画像一覧表示時に原寸画像を全て送信するとレスポンスが遅くなる。

#### 決定
Pillowでサムネイルを生成し、`~/.cache/my-app/thumbs/` にファイルとしてキャッシュする。

#### 理由
- ブラウザへの転送量を削減（原寸数MB → サムネイル数十KB）
- ファイルキャッシュはプロセス再起動後も有効
- SHA256ハッシュによるキャッシュキーで衝突リスクを排除
- mtime比較で元ファイル更新時の整合性を担保

#### 結果
- 初回アクセス時のみサムネイル生成コスト（数十ms/枚）が発生
- ディスク使用量が増加（1枚あたり数十KB、1000枚で数十MB程度）

### ADR-003: ポート番号を5001に固定

#### 状況
デフォルトポート（5173, 8000, 8080）は他ツールとの競合リスクがある。

#### 決定
FastAPIのポートを5001に固定する。

#### 理由
- 5173はVite dev serverのデフォルト（開発時に使用するため空けておく）
- 8000はUvicorn/Djangoのデフォルトで競合しやすい
- 8080はプロキシ系ツールでよく使われる
- 5001は比較的空いている番号帯

#### 結果
- 他に5001を使うサービスがある場合は設定変更が必要（環境変数で上書き可能にする）

## 実装順序

### Phase 1: バックエンド基盤

1. `src-tauri/` ディレクトリを削除、Tauri関連の依存・設定を除去
2. `backend/` ディレクトリを作成、`pyproject.toml` を定義
3. `uv sync` で仮想環境と依存をセットアップ
4. FastAPIアプリの骨格（`main.py`, `config.py`）を作成
5. SQLAlchemy + Alembic でDB基盤を構築
6. 初期マイグレーション（`settings` テーブル）を作成・適用

### Phase 2: APIエンドポイント実装

7. `/api/settings` エンドポイントを実装
8. `/api/images`（一覧取得）エンドポイントを実装
9. `/api/images/thumb/{path}` サムネイル生成・配信を実装
10. `/api/images/full/{path}` 原寸画像配信を実装
11. `/api/images`（DELETE、ゴミ箱移動）を実装
12. `/api/health` を実装

### Phase 3: フロントエンド差し替え

13. `vite.config.ts` にプロキシ設定を追加
14. `src/lib/api.ts`（APIクライアント）を作成
15. `useSettings.ts` をfetch API経由に書き換え
16. `useImages.ts` をfetch API経由に書き換え
17. `FolderSetup.tsx` をテキスト入力方式に変更（ネイティブダイアログ廃止）
18. `ImageCard.tsx` のサムネイル表示をAPI URLに変更
19. `ImagePreview.tsx` のフルサイズ表示をAPI URLに変更
20. Tauri関連パッケージ（`@tauri-apps/*`）を`package.json`から削除

### Phase 4: 本番配信・仕上げ

21. FastAPIで `dist/` の静的ファイル配信を設定
22. `Taskfile.yml` を新タスク構成に書き換え
23. 動作確認（開発モード・本番モード両方）
24. `CLAUDE.md` / `.claude/plan.md` を最終更新

## 検証方法

- `task dev` → Vite dev server + FastAPI が起動し、ブラウザでサムネイルグリッドが表示される
- フォルダパスを設定後、再起動してもパスが保持されている（SQLite永続化確認）
- サムネイルが `~/.cache/my-app/thumbs/` にキャッシュされている
- 2回目のアクセスではサムネイルがキャッシュから配信される（レスポンス高速化）
- 画像クリックで原寸プレビューが表示される
- 削除ボタンでゴミ箱に移動し、グリッドから消える
- `task build && task start` → ポート5001のみでフロント・バックが動作する
