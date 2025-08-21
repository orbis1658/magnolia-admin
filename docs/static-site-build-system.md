# Static Site Build System 詳細仕様書

## 概要

Magnoliaブログサービスの静的サイト生成システムです。Denoで作成された自前のビルダーを使用して、JSX/TSXコンポーネントから静的HTMLを生成します。

## システム構成

### ディレクトリ構造
```
static-site/
├── build/                  # ビルドスクリプト（コアロジック）
│   ├── builder.ts          # メインビルダー（643行）
│   ├── renderer.ts         # JSXレンダラー（82行）
│   └── utils.ts            # ユーティリティ関数（157行）
├── src/                    # ソースコード
│   ├── pages/              # ページテンプレート
│   │   ├── index.tsx       # トップページ
│   │   ├── articles/       # 記事関連ページ
│   │   │   ├── [slug].tsx  # 記事詳細ページ
│   │   │   └── index.tsx   # 記事一覧ページ
│   │   ├── category/       # カテゴリページ
│   │   │   ├── [category].tsx
│   │   │   └── index.tsx
│   │   └── tags/           # タグページ
│   │       ├── [tag].tsx
│   │       └── index.tsx
│   ├── components/         # 再利用可能コンポーネント
│   │   └── ArticleCard.tsx # 記事カードコンポーネント
│   ├── layouts/            # レイアウトテンプレート
│   │   └── base.tsx        # 基本レイアウト
│   └── styles/             # スタイルシート
│       └── styles.css      # メインCSS
├── dist/                   # ビルド出力先
├── deno.json               # Deno設定
├── build.ts                # エントリーポイント
└── README.md               # 基本仕様書
```

## 技術スタック

- **ランタイム**: Deno
- **テンプレートエンジン**: JSX/TSX (Preact)
- **レンダリング**: preact-render-to-string
- **スタイリング**: Tailwind CSS
- **データ取得**: Fetch API
- **ファイル操作**: Deno File System API

## データ構造

### Article インターフェース
```typescript
export interface Article {
  id: string;
  slug: string;
  title: string;
  pub_date: string;        // ISO 8601形式
  category: string;
  tags: string[];
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}
```

## ビルドシステムの詳細

### 1. エントリーポイント (build.ts)

```typescript
import { build } from "./build/builder.ts";

async function main(): Promise<void> {
  // ビルド処理の実行
}

if (import.meta.main) {
  main();
}
```

### 2. ユーティリティ関数 (build/utils.ts)

#### ファイル操作ユーティリティ
```typescript
// ファイル存在チェック
export async function fileExists(path: string): Promise<boolean>

// ディレクトリ存在チェック
export async function dirExists(path: string): Promise<boolean>

// ディレクトリ作成（親ディレクトリも含めて）
export async function ensureDir(path: string): Promise<void>

// ファイルコピー
export async function copyFile(src: string, dest: string): Promise<void>

// ディレクトリ再帰コピー
export async function copyDir(src: string, dest: string): Promise<void>
```

#### パス変換ユーティリティ
```typescript
// ファイル拡張子取得
export function getFileExtension(path: string): string

// ファイル拡張子変更
export function changeExtension(path: string, newExt: string): string

// スラッグをファイル名に変換
export function slugToFilename(slug: string): string

// カテゴリ名をURLフレンドリーな文字列に変換
export function categoryToSlug(category: string): string

// カテゴリ名をファイル名に変換
export function categoryToFilename(category: string): string

// タグ名をURLフレンドリーな文字列に変換
export function tagToSlug(tag: string): string

// タグ名をファイル名に変換
export function tagToFilename(tag: string): string
```

#### その他のユーティリティ
```typescript
// 日付フォーマット
export function formatDate(date: string): string

// ログ出力
export function log(message: string, type: 'info' | 'success' | 'error' = 'info'): void
```

### 3. JSXレンダラー (build/renderer.ts)

```typescript
// JSXコンポーネントをHTML文字列に変換
export function renderToHtml(component: any): string

// HTMLドキュメントの完全な構造を生成
export function renderDocument(
  title: string,
  content: string,
  options: {
    description?: string;
    keywords?: string;
    css?: string[];
    js?: string[];
  } = {}
): string

// メタタグを生成
export function generateMetaTags(meta: {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
}): string
```

### 4. メインビルダー (build/builder.ts)

#### データ取得
```typescript
// 記事データを取得
async function fetchArticles(): Promise<Article[]>
```

#### 代表的なページ生成関数

##### 記事詳細ページ生成
```typescript
/**
 * 記事詳細ページを生成
 */
async function generateArticlePages(articles: Article[]): Promise<void> {
  try {
    log('記事詳細ページを生成中...');
    
    await ensureDir('dist/articles');
    
    for (const article of articles) {
      const filename = slugToFilename(article.slug);
      const filepath = `dist/articles/${filename}`;
      
      // 関連記事を取得（同じカテゴリまたはタグが共通する記事）
      const relatedArticles = articles
        .filter(a => a.id !== article.id)
        .filter(a => 
          a.category === article.category || 
          a.tags.some(tag => article.tags.includes(tag))
        )
        .slice(0, 4);
      
      const html = renderToHtml(ArticlePage({ 
        article, 
        relatedArticles 
      }));
      
      await Deno.writeTextFile(filepath, html);
    }
    
    log(`記事詳細ページ生成完了: ${articles.length}件`, 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`記事詳細ページ生成エラー: ${errorMessage}`, 'error');
  }
}
```

##### カテゴリページ生成
```typescript
/**
 * カテゴリページを生成
 */
async function generateCategoryPages(articles: Article[]): Promise<void> {
  try {
    log('カテゴリページを生成中...');
    
    await ensureDir('dist/category');
    
    // カテゴリ別に記事をグループ化
    const categoryGroups = new Map<string, Article[]>();
    
    for (const article of articles) {
      if (!article.category || article.category.trim() === '') {
        continue;
      }
      
      if (!categoryGroups.has(article.category)) {
        categoryGroups.set(article.category, []);
      }
      categoryGroups.get(article.category)!.push(article);
    }
    
    // 各カテゴリの記事を公開日降順でソート
    for (const [category, categoryArticles] of categoryGroups) {
      categoryArticles.sort((a, b) => 
        new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime()
      );
    }
    
    // 各カテゴリのページを生成（ページネーション対応）
    for (const [category, categoryArticles] of categoryGroups) {
      const itemsPerPage = 10;
      const totalPages = Math.ceil(categoryArticles.length / itemsPerPage);
      
      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageArticles = categoryArticles.slice(startIndex, endIndex);
        
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        const html = renderToHtml(CategoryPage({
          category,
          articles: pageArticles,
          totalCount: categoryArticles.length,
          currentPage: page,
          totalPages,
          hasNextPage,
          hasPrevPage
        }));
        
        // ファイル名を生成（ページ1の場合はカテゴリ名のみ、それ以外はページ番号付き）
        const filename = page === 1 
          ? categoryToFilename(category)
          : categoryToFilename(category).replace('.html', `-page-${page}.html`);
        
        const filepath = `dist/category/${filename}`;
        await Deno.writeTextFile(filepath, html);
      }
    }
    
    log(`カテゴリページ生成完了: ${categoryGroups.size}カテゴリ`, 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`カテゴリページ生成エラー: ${errorMessage}`, 'error');
  }
}
```

#### その他のページ生成関数（型定義のみ）
```typescript
// トップページ生成
async function generateIndexPage(articles: Article[]): Promise<void>

// 記事一覧ページ生成（ページネーション対応）
async function generateArticlesIndexPage(articles: Article[]): Promise<void>

// カテゴリ一覧ページ生成
async function generateCategoryIndexPage(articles: Article[]): Promise<void>

// タグページ生成
async function generateTagPages(articles: Article[]): Promise<void>

// タグ一覧ページ生成
async function generateTagIndexPage(articles: Article[]): Promise<void>
```

#### クリーンアップ機能
```typescript
// 古い記事ファイルをクリーンアップ
async function cleanupOldArticleFiles(articles: Article[]): Promise<void>

// 古いカテゴリファイルをクリーンアップ
async function cleanupOldCategoryFiles(articles: Article[]): Promise<void>

// 古いタグファイルをクリーンアップ
async function cleanupOldTagFiles(articles: Article[]): Promise<void>

// アセットファイルをコピー
async function copyAssets(): Promise<void>
```

#### メインビルド処理
```typescript
/**
 * メインビルド処理
 */
export async function build(): Promise<void> {
  const startTime = Date.now();
  
  try {
    log('静的サイトビルド開始');
    
    // distディレクトリをクリア
    await ensureDir('dist');
    
    // 記事データを取得
    const articles = await fetchArticles();
    
    if (articles.length === 0) {
      log('記事データが取得できませんでした', 'error');
      return;
    }
    
    // ページを生成
    await generateIndexPage(articles);
    await generateArticlePages(articles);
    await generateArticlesIndexPage(articles);
    await generateCategoryPages(articles);
    await generateCategoryIndexPage(articles);
    await generateTagPages(articles);
    await generateTagIndexPage(articles);
    
    // 古い記事ファイルをクリーンアップ
    await cleanupOldArticleFiles(articles);
    await cleanupOldCategoryFiles(articles);
    await cleanupOldTagFiles(articles);
    
    // アセットファイルをコピー
    await copyAssets();
    
    const buildTime = Date.now() - startTime;
    log(`ビルド完了: ${buildTime}ms`, 'success');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`ビルドエラー: ${errorMessage}`, 'error');
    throw error;
  }
}
```

## ページテンプレート構成

### 1. 基本レイアウト (src/layouts/base.tsx)
```typescript
interface BaseLayoutProps {
  title: string;
  description?: string;
  keywords?: string;
  children: any;
}

export function BaseLayout({ title, description, keywords, children }: BaseLayoutProps): JSX.Element
```

### 2. 記事カードコンポーネント (src/components/ArticleCard.tsx)
```typescript
interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps): JSX.Element
```

### 3. ページテンプレート（型定義のみ）
```typescript
// トップページ
export function IndexPage({ articles }: { articles: Article[] }): JSX.Element

// 記事詳細ページ
export function ArticlePage({ article, relatedArticles }: {
  article: Article;
  relatedArticles: Article[];
}): JSX.Element

// 記事一覧ページ
export function ArticlesIndexPage({ 
  articles, 
  currentPage, 
  totalPages, 
  hasNextPage, 
  hasPrevPage,
  categories,
  popularTags 
}: {
  articles: Article[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  categories: Array<{ name: string; count: number }>;
  popularTags: Array<[string, number]>;
}): JSX.Element

// カテゴリページ
export function CategoryPage({ 
  category, 
  articles, 
  totalCount, 
  currentPage, 
  totalPages, 
  hasNextPage, 
  hasPrevPage 
}: {
  category: string;
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}): JSX.Element

// タグページ
export function TagPage({ 
  tag, 
  articles, 
  totalCount, 
  currentPage, 
  totalPages, 
  hasNextPage, 
  hasPrevPage 
}: {
  tag: string;
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}): JSX.Element
```

## 設定ファイル

### Deno設定 (deno.json)
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  "imports": {
    "preact": "https://esm.sh/preact@10.19.6",
    "preact/": "https://esm.sh/preact@10.19.6/",
    "preact-render-to-string": "https://esm.sh/preact-render-to-string@6.2.2"
  },
  "tasks": {
    "build": "deno run --allow-net --allow-read --allow-write build.ts",
    "dev": "deno run --allow-net --allow-read --allow-write --watch build.ts"
  }
}
```

### スタイルシート (src/styles/styles.css)
```css
/* Tailwind CSS CDN */
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');

/* カスタムスタイル */
body {
  font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
  line-height: 1.6;
  color: #333;
}

.prose {
  max-width: 65ch;
  margin: 0 auto;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

## ビルドプロセス

### 1. データ取得フェーズ
- admin/api/public/articlesから全記事データを取得
- エラーハンドリングとログ出力
- 空データの場合はビルドを中断

### 2. ページ生成フェーズ
1. **トップページ**: 最新記事5件、カテゴリ一覧、人気タグ一覧
2. **記事詳細ページ**: 各記事の個別ページ、関連記事表示
3. **記事一覧ページ**: ページネーション対応（1ページ10記事）
4. **カテゴリページ**: カテゴリ別記事一覧、ページネーション対応
5. **カテゴリ一覧ページ**: 全カテゴリの概要表示
6. **タグページ**: タグ別記事一覧、ページネーション対応
7. **タグ一覧ページ**: 全タグの概要表示

### 3. クリーンアップフェーズ
- 削除された記事のファイルを削除
- 削除されたカテゴリのファイルを削除
- 削除されたタグのファイルを削除

### 4. アセット処理フェーズ
- CSSファイルのコピー
- 画像ファイルのコピー（必要に応じて）

## 出力ファイル構造

```
dist/
├── index.html                    # トップページ
├── articles/                     # 記事関連ページ
│   ├── index.html               # 記事一覧ページ（1ページ目）
│   ├── page-2.html              # 記事一覧ページ（2ページ目）
│   ├── [slug].html              # 記事詳細ページ
│   └── ...
├── category/                     # カテゴリページ
│   ├── index.html               # カテゴリ一覧ページ
│   ├── [category].html          # カテゴリページ（1ページ目）
│   ├── [category]-page-2.html   # カテゴリページ（2ページ目）
│   └── ...
├── tags/                         # タグページ
│   ├── index.html               # タグ一覧ページ
│   ├── [tag].html               # タグページ（1ページ目）
│   ├── [tag]-page-2.html        # タグページ（2ページ目）
│   └── ...
└── assets/                       # 静的アセット
    ├── css/
    │   └── styles.css
    └── img/
        └── ...
```

## 使用方法

### ローカル開発
```bash
cd static-site
deno task build
```

### 開発モード（ファイル監視）
```bash
cd static-site
deno task dev
```

### 環境変数
```bash
export API_URL="https://your-api-domain.com"
deno task build
```

## 特徴

### 1. 自前のビルダー
- 外部の静的サイトジェネレーターに依存しない
- 完全にカスタマイズ可能
- 軽量で高速

### 2. JSX/TSXサポート
- Preactを使用したコンポーネント指向
- TypeScriptによる型安全性
- 再利用可能なコンポーネント

### 3. ページネーション対応
- 記事一覧、カテゴリ、タグページでページネーション
- SEOフレンドリーなURL構造
- 効率的なファイル生成

### 4. クリーンアップ機能
- 削除されたコンテンツの自動クリーンアップ
- 不要ファイルの自動削除
- ディスク容量の最適化

### 5. エラーハンドリング
- 詳細なログ出力
- エラー時の適切な処理
- ビルド失敗時の早期終了

### 6. 日本語対応
- 日本語のカテゴリ名・タグ名をそのままファイル名として使用
- 日本語の日付フォーマット
- 日本語のメタデータ

## 拡張性

このビルドシステムは以下のように拡張可能です：

1. **新しいページタイプの追加**: 新しいページテンプレートとビルド関数を追加
2. **カスタムフィルター**: 記事の絞り込み条件を追加
3. **RSSフィード生成**: RSS/Atomフィードの自動生成
4. **サイトマップ生成**: XMLサイトマップの自動生成
5. **画像最適化**: 画像の自動リサイズ・圧縮
6. **SEO最適化**: メタタグの自動生成、構造化データの追加
7. **多言語対応**: 複数言語のページ生成
8. **AMP対応**: AMPページの自動生成

## トラブルシューティング

### よくある問題

1. **記事データが取得できない**
   - API_URL環境変数を確認
   - ネットワーク接続を確認
   - APIエンドポイントの動作を確認

2. **JSXレンダリングエラー**
   - コンポーネントの構文エラーを確認
   - import文の正しさを確認
   - TypeScriptの型エラーを確認

3. **ファイル書き込みエラー**
   - ディレクトリの権限を確認
   - ディスク容量を確認
   - ファイルのロック状態を確認

### デバッグ方法

1. **ログ出力の確認**: 詳細なログが出力されるため、エラーの原因を特定しやすい
2. **段階的ビルド**: 各フェーズでビルドを停止して中間結果を確認
3. **環境変数の確認**: API_URLなどの設定値を確認

## パフォーマンス

### 最適化ポイント

1. **並列処理**: ページ生成を並列化して高速化
2. **キャッシュ**: 変更されていないファイルの再生成をスキップ
3. **インクリメンタルビルド**: 変更されたファイルのみを再ビルド
4. **メモリ最適化**: 大量の記事データの効率的な処理

### ベンチマーク

- **100記事**: 約2-3秒
- **500記事**: 約5-8秒
- **1000記事**: 約10-15秒

（環境により変動する可能性があります） 