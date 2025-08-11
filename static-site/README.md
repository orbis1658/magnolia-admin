# 静的ブログビルドシステム 仕様書

## 概要
magnoliaブログサービスの静的サイト生成システムです。admin/の記事管理APIからデータを取得し、Deno Lumeを使用して静的HTMLを生成します。

**注意**: このディレクトリは`static-site/`にリネームされました。admin/の`static/`フォルダとの競合を避けるためです。

## システム構成

### アーキテクチャ
```
static-site/
├── README.md           # このファイル
├── deno.json          # Deno設定ファイル
├── deno.lock          # 依存関係ロックファイル
├── lume.config.ts     # Lume設定ファイル
├── src/
│   ├── _includes/     # レイアウトテンプレート
│   ├── _data/         # データ処理スクリプト
│   ├── pages/         # ページテンプレート
│   ├── components/    # JSX/TSXコンポーネント
│   └── styles/        # CSS/SCSSファイル
├── public/            # 静的アセット
└── dist/              # ビルド出力先
```

## 技術スタック

### コア技術
- **Deno Lume**: 静的サイト生成エンジン
- **JSX/TSX**: テンプレートエンジン
- **TypeScript**: 開発言語
- **Tailwind CSS**: スタイリング（admin/と統一）

### 主要依存関係
- `lume`: 静的サイト生成
- `jsx`: JSX/TSXサポート
- `postcss`: CSS処理
- `tailwindcss`: CSSフレームワーク

## データフロー

### 1. 記事データ取得
- **ソース**: `admin/api/articles` エンドポイント
- **形式**: JSON（API設計書に準拠）
- **処理**: ビルド時にデータを取得し、Lumeのデータコンテキストに格納

### 2. データ構造
```typescript
interface Article {
  id: string;
  slug: string;
  title: string;
  pub_date: string;
  category: string;
  tags: string[];
  body: string;
  created_at: string;
  updated_at: string;
}

interface BuildData {
  articles: Article[];
  categories: string[];
  tags: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
```

## ページ構成

### 1. トップページ (`/`)
- 最新記事一覧（ページネーション対応）
- カテゴリ・タグフィルタ
- 検索機能

### 2. 記事詳細ページ (`/articles/{slug}`)
- 記事の完全な内容表示
- メタデータ（タイトル、日付、カテゴリ、タグ）
- 関連記事表示

### 3. カテゴリページ (`/categories/{category}`)
- 特定カテゴリの記事一覧
- ページネーション対応

### 4. タグページ (`/tags/{tag}`)
- 特定タグの記事一覧
- ページネーション対応

### 5. アーカイブページ (`/archive`)
- 月別・年別記事一覧
- 時系列での記事表示

## テンプレート設計

### レイアウト構造
```
_includes/
├── base.tsx           # 基本レイアウト
├── head.tsx           # メタ情報
├── header.tsx         # ヘッダー
├── footer.tsx         # フッター
├── navigation.tsx     # ナビゲーション
└── pagination.tsx     # ページネーション
```

### コンポーネント
```
components/
├── ArticleCard.tsx    # 記事カード
├── ArticleList.tsx    # 記事一覧
├── CategoryList.tsx   # カテゴリ一覧
├── TagCloud.tsx       # タグクラウド
├── SearchBox.tsx      # 検索ボックス
└── RelatedArticles.tsx # 関連記事
```

## ビルドプロセス

### 1. データ取得フェーズ
- admin/APIから記事データを取得
- カテゴリ・タグの集計処理
- ページネーション情報の計算

### 2. テンプレート処理フェーズ
- JSX/TSXテンプレートのコンパイル
- データとテンプレートの結合
- コンポーネントのレンダリング

### 3. アセット処理フェーズ
- CSS/SCSSのコンパイル
- 画像の最適化
- 静的アセットのコピー

### 4. 出力フェーズ
- HTMLファイルの生成
- サイトマップの生成
- RSSフィードの生成

## 設定ファイル

### deno.json
```json
{
  "imports": {
    "lume": "https://deno.land/x/lume@v2.0.0/mod.ts",
    "jsx": "https://deno.land/x/lume@v2.0.0/plugins/jsx.ts"
  },
  "tasks": {
    "build": "deno run -A lume.ts",
    "serve": "deno run -A lume.ts --serve",
    "dev": "deno run -A lume.ts --dev"
  }
}
```

### lume.config.ts
- JSX/TSXプラグインの設定
- PostCSS/Tailwind CSSの設定
- データ処理プラグインの設定
- 出力ディレクトリの設定

## 開発・ビルドコマンド

### 開発環境
```bash
# 開発サーバー起動
deno task dev

# ローカルサーバー起動
deno task serve
```

### 本番ビルド
```bash
# 静的ファイル生成
deno task build
```

## SEO・パフォーマンス

### SEO対策
- メタタグの自動生成
- 構造化データ（JSON-LD）の埋め込み
- サイトマップの自動生成
- RSSフィードの生成

### パフォーマンス最適化
- CSS/JSの最小化
- 画像の最適化
- プリロード・プリフェッチ
- キャッシュ戦略

## 今後の拡張予定

- [ ] 検索機能の実装
- [ ] コメントシステムの統合
- [ ] ソーシャルメディア連携
- [ ] アナリティクス統合
- [ ] PWA対応
- [ ] 多言語対応 