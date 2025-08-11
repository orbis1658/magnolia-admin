import { log, ensureDir, slugToFilename, copyFile } from "./utils.ts";
import { renderToHtml } from "./renderer.ts";
import { IndexPage } from "../src/pages/index.tsx";
import { ArticlePage } from "../src/pages/articles/[slug].tsx";

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
    
    // adminサーバーから記事データを取得（公開用エンドポイント）
    const apiUrl = Deno.env.get('API_URL') || 'https://your-domain.com';
    console.log('API URL:', apiUrl);
    const response = await fetch(`${apiUrl}/api/public/articles`);
    
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
    
    const html = renderToHtml(IndexPage({ articles }));
    
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

/**
 * アセットファイルをコピー
 */
async function copyAssets(): Promise<void> {
  try {
    log('アセットファイルをコピー中...');
    
    await ensureDir('dist/assets/css');
    
    // CSSファイルをコピー
    await copyFile('src/styles/styles.css', 'dist/assets/css/styles.css');
    
    log('アセットファイルコピー完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`アセットファイルコピーエラー: ${errorMessage}`, 'error');
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