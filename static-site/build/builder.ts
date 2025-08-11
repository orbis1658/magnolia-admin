import { log, ensureDir, slugToFilename } from "./utils.ts";
import { renderToHtml, renderDocument } from "./renderer.ts";

// 記事データの型定義
export interface Article {
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

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 記事データを取得
 */
async function fetchArticles(): Promise<Article[]> {
  try {
    log('記事データを取得中...');
    
    // adminサーバーから記事データを取得
    const response = await fetch('http://localhost:8000/api/articles');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ArticleListResponse = await response.json();
    log(`記事データ取得成功: ${data.articles.length}件`, 'success');
    
    return data.articles;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`記事データ取得エラー: ${errorMessage}`, 'error');
    return [];
  }
}

/**
 * トップページを生成
 */
async function generateIndexPage(articles: Article[]): Promise<void> {
  try {
    log('トップページを生成中...');
    
    // 最新の記事を5件取得
    const recentArticles = articles
      .sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime())
      .slice(0, 5);
    
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Magnolia Blog</h1>
        <div class="grid gap-6">
          ${recentArticles.map(article => `
            <article class="border rounded-lg p-6">
              <h2 class="text-2xl font-semibold mb-2">
                <a href="/articles/${article.slug}.html" class="text-blue-600 hover:text-blue-800">
                  ${article.title}
                </a>
              </h2>
              <div class="text-gray-600 mb-4">
                <span class="mr-4">${new Date(article.pub_date).toLocaleDateString('ja-JP')}</span>
                <span class="mr-4">カテゴリ: ${article.category}</span>
                ${article.tags.map(tag => `<span class="bg-gray-200 px-2 py-1 rounded text-sm mr-2">${tag}</span>`).join('')}
              </div>
              <p class="text-gray-700">${article.body.substring(0, 200)}...</p>
            </article>
          `).join('')}
        </div>
      </div>
    `;
    
    const html = renderDocument('Magnolia Blog - ホーム', content, {
      description: 'Magnoliaブログの最新記事一覧',
      css: ['/assets/css/styles.css']
    });
    
    await Deno.writeTextFile('dist/index.html', html);
    log('トップページ生成完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`トップページ生成エラー: ${errorMessage}`, 'error');
  }
}

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
      
      const content = `
        <div class="container mx-auto px-4 py-8">
          <article class="max-w-4xl mx-auto">
            <header class="mb-8">
              <h1 class="text-4xl font-bold mb-4">${article.title}</h1>
              <div class="text-gray-600 mb-4">
                <span class="mr-4">公開日: ${new Date(article.pub_date).toLocaleDateString('ja-JP')}</span>
                <span class="mr-4">カテゴリ: ${article.category}</span>
              </div>
              <div class="mb-4">
                ${article.tags.map(tag => `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2">${tag}</span>`).join('')}
              </div>
            </header>
            <div class="prose max-w-none">
              ${article.body}
            </div>
            <footer class="mt-8 pt-8 border-t">
              <a href="/" class="text-blue-600 hover:text-blue-800">← ホームに戻る</a>
            </footer>
          </article>
        </div>
      `;
      
      const html = renderDocument(article.title, content, {
        description: article.body.substring(0, 160),
        keywords: article.tags.join(', '),
        css: ['/assets/css/styles.css']
      });
      
      await Deno.writeTextFile(filepath, html);
    }
    
    log(`記事詳細ページ生成完了: ${articles.length}件`, 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`記事詳細ページ生成エラー: ${errorMessage}`, 'error');
  }
}

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
    
    const buildTime = Date.now() - startTime;
    log(`ビルド完了: ${buildTime}ms`, 'success');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`ビルドエラー: ${errorMessage}`, 'error');
    throw error;
  }
} 