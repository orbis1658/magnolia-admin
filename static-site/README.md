# 静的ブログビルドシステム 仕様書

## 概要
magnoliaブログサービスの静的サイト生成システムです。admin/の記事管理APIからデータを取得し、Denoで作成した自前のコードを使用して静的HTMLを生成します。

## システム構成

### 1. データフロー
```
admin/articles (管理画面) 
    ↓ (ページ生成ボタン)
admin/api/build (ビルドAPI)
    ↓ (記事データ取得)
admin/api/articles (記事API)
    ↓ (静的サイト生成)
static-site/ (静的サイト)
    ↓ (デプロイ)
レンタルサーバー
```

### 2. 技術スタック
- **静的サイト生成**: 自前のDenoスクリプト
- **テンプレートエンジン**: JSX/TSX (DenoのJSXサポート)
- **スタイリング**: Tailwind CSS
- **デプロイ**: GitHub Actions + rsync

## 詳細仕様

### 1. 記事データ構造
```typescript
interface Article {
  id: string;
  slug: string;
  title: string;
  pub_date: string; // ISO 8601形式
  category: string;
  tags: string[];
  body: string;
  created_at: string;
  updated_at: string;
}
```

### 2. 静的サイト構造
```
static-site/
├── dist/                    # ビルド出力先
│   ├── index.html          # トップページ
│   ├── articles/           # 記事ページ
│   │   ├── [slug].html
│   │   └── category/
│   │       └── [category].html
│   ├── category/           # カテゴリページ
│   │   └── [category].html
│   ├── tags/               # タグページ
│   │   └── [tag].html
│   ├── assets/             # 静的アセット
│   │   ├── css/
│   │   └── js/
│   └── sitemap.xml         # サイトマップ
├── src/
│   ├── pages/              # ページテンプレート
│   │   ├── index.tsx       # トップページ
│   │   ├── articles/       # 記事関連ページ
│   │   │   └── [slug].tsx  # 記事詳細ページ
│   │   └── category/       # カテゴリページ
│   │       └── [category].tsx
│   ├── components/         # 再利用可能コンポーネント
│   ├── layouts/            # レイアウトテンプレート
│   └── styles/             # スタイルシート
├── build/                  # ビルドスクリプト
│   ├── builder.ts          # メインビルダー
│   ├── renderer.ts         # JSXレンダラー
│   └── utils.ts            # ユーティリティ
├── deno.json               # Deno設定
└── build.ts                # エントリーポイント
```

### 3. ページ種類
1. **トップページ** (`/`)
   - 最新記事一覧（ページネーション対応）
   - カテゴリ一覧
   - 人気タグ一覧

2. **記事詳細ページ** (`/articles/[slug]`)
   - 記事本文
   - メタデータ（カテゴリ、タグ、公開日）
   - 関連記事
   - 前後の記事ナビゲーション

3. **カテゴリページ** (`/category/[category]`)
   - カテゴリ別記事一覧（最新順）
   - ページネーション対応（1ページあたり10記事）
   - カテゴリ名の表示
   - 記事数表示
   - 記事カード形式での一覧表示
   - パンくずナビゲーション
   - 関連カテゴリへのリンク

4. **タグページ** (`/tags/[tag]`)
   - タグ別記事一覧
   - ページネーション対応

### 4. API仕様

#### ビルドAPI (`/api/build`)
```typescript
// POST /api/build
interface BuildRequest {
  force?: boolean; // 強制再ビルド
}

interface BuildResponse {
  success: boolean;
  message: string;
  buildTime?: number;
  generatedPages?: number;
}
```

#### 記事取得API
- **管理用API** (`/api/articles`): 認証必要、管理画面用
- **公開用API** (`/api/public/articles`): 認証不要、静的サイト生成用
  - CORS対応
  - デフォルトで100件取得
  - カテゴリ・タグフィルタリング対応

### 5. ビルドプロセス
1. **データ取得**: admin/api/public/articlesから全記事データを取得
2. **JSXレンダリング**: 自前のJSXレンダラーでHTMLに変換
3. **ページ生成**: 各ページテンプレートにデータを適用してHTML生成
4. **アセット処理**: CSS、JS、画像の最適化とコピー
5. **サイトマップ生成**: XMLサイトマップの自動生成
6. **出力**: dist/ディレクトリに静的ファイルを出力

### 6. 自前ビルダーの構成
- **builder.ts**: メインビルドロジック、データ取得、ページ生成の制御
- **renderer.ts**: JSXコンポーネントをHTML文字列に変換
- **utils.ts**: ファイル操作、パス解決、ユーティリティ関数
- **build.ts**: エントリーポイント、CLI引数処理

### 7. ページテンプレート構成
- **src/layouts/base.tsx**: 基本レイアウトテンプレート
- **src/components/ArticleCard.tsx**: 記事カードコンポーネント
- **src/pages/index.tsx**: トップページテンプレート
- **src/pages/articles/[slug].tsx**: 記事詳細ページテンプレート
- **src/pages/category/[category].tsx**: カテゴリページテンプレート

### 8. デプロイワークフロー
1. **ローカル開発**: `cd static-site && deno run --allow-net --allow-read --allow-write build.ts`でローカルビルド
2. **手動デプロイ**: admin/articlesからビルドボタンで手動実行 ✅
3. **自動デプロイ**: GitHub Actionsでmainブランチへのプッシュ時に自動実行 ✅
4. **サーバーアップロード**: rsyncでレンタルサーバーに同期 ✅

## 要件
- admin/api/articlesから記事データを取得する
- 静的なhtmlを出力する
- 可能なら、jsxなどコンポーネント志向でページを組み立てたい
- admin/articlesからページ生成機能を呼び出したい
- 最終的には、admin/articlesのページ生成ボタンを押したら、Github Actions上で静的ページが生成され、レンタルサーバーにrsync等でアップロードするワークフローにする

## 実装優先度
1. **Phase 1**: 自前の静的サイト生成システム ✅
   - ✅ Step 1: 自前ビルダーの基盤作成
   - ✅ Step 2: 基本的なページテンプレート作成
   - ✅ Step 3: 記事データ取得機能の実装
   - ✅ Step 4: 基本的なビルド機能のテスト
2. **Phase 2**: 管理画面からのビルド機能 ✅
   - ✅ Step 1: ビルドAPIの作成
   - ✅ Step 2: 管理画面UIの拡張
   - ✅ Step 3: ビルド状況の表示機能
3. **Phase 3**: GitHub Actions自動デプロイ ✅
   - ✅ Step 1: GitHub Actionsワークフロー作成
   - ✅ Step 2: ビルドとデプロイの自動化
   - ✅ Step 3: サーバー設定（基盤完成）
4. **Phase 4**: 高度な機能（検索、RSS、OGP等）

## カテゴリページ実装仕様

### 1. ファイル構成
```
src/pages/category/
└── [category].tsx          # カテゴリページテンプレート
```

### 2. カテゴリページテンプレート仕様

#### データ取得
- **対象**: 指定されたカテゴリに属する記事のみ
- **ソート**: 公開日降順（最新順）
- **ページネーション**: 1ページあたり10記事
- **フィルタ**: 公開済み記事のみ（pub_date <= 現在日時）

#### ページ構造
```typescript
interface CategoryPageData {
  category: string;
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

#### UI構成
1. **ヘッダー部分**
   - カテゴリ名（h1）
   - 記事数表示（例：「技術記事 15件」）
   - パンくずナビゲーション（ホーム > カテゴリ > [カテゴリ名]）

2. **記事一覧**
   - ArticleCardコンポーネントを使用
   - グリッドレイアウト（レスポンシブ対応）
   - 記事が見つからない場合のメッセージ表示

3. **ページネーション**
   - 前のページ/次のページリンク
   - ページ番号表示（現在ページをハイライト）
   - 最初/最後ページへの直接リンク

4. **サイドバー（オプション）**
   - 他のカテゴリ一覧
   - 人気タグ一覧
   - 最新記事一覧

#### URL構造
- **基本URL**: `/category/[category]`
- **ページネーション**: `/category/[category]?page=2`
- **例**: `/category/technology`, `/category/technology?page=2`

#### メタデータ
- **title**: `[カテゴリ名] - 記事一覧 | サイト名`
- **description**: `[カテゴリ名]に関する記事一覧です。[記事数]件の記事があります。`
- **og:title**: `[カテゴリ名] - 記事一覧`
- **og:description**: `[カテゴリ名]に関する記事一覧`

### 3. ビルド時の処理
1. **カテゴリ一覧取得**: 全記事からユニークなカテゴリを抽出
2. **カテゴリ別記事グループ化**: 各カテゴリに属する記事を分類
3. **ページネーション計算**: 各カテゴリの記事数を基にページ数を算出
4. **HTML生成**: 各カテゴリの各ページを生成

### 4. 実装例
```typescript
// src/pages/category/[category].tsx
export default function CategoryPage({ 
  category, 
  articles, 
  currentPage, 
  totalPages 
}: CategoryPageData) {
  return (
    <BaseLayout>
      <div className="container mx-auto px-4">
        <Breadcrumb items={[
          { name: "ホーム", href: "/" },
          { name: "カテゴリ", href: "/categories" },
          { name: category, href: `/category/${category}` }
        ]} />
        
        <h1 className="text-3xl font-bold mb-4">
          {category} ({articles.length}件)
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={`/category/${category}`}
        />
      </div>
    </BaseLayout>
  );
}
```