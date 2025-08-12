import { log, ensureDir, slugToFilename, categoryToFilename, categoryToSlug, tagToFilename, tagToSlug, copyFile } from "./utils.ts";
import { renderToHtml } from "./renderer.ts";
import { IndexPage } from "../src/pages/index.tsx";
import { ArticlePage } from "../src/pages/articles/[slug].tsx";
import { CategoryPage } from "../src/pages/category/[category].tsx";
import { CategoryIndexPage } from "../src/pages/category/index.tsx";
import { TagPage } from "../src/pages/tags/[tag].tsx";
import { TagIndexPage } from "../src/pages/tags/index.tsx";

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
    const apiUrl = Deno.env.get('API_URL') || 'https://magnolia-admin.deno.dev';
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
 * カテゴリページを生成
 */
async function generateCategoryPages(articles: Article[]): Promise<void> {
  try {
    log('カテゴリページを生成中...');
    
    await ensureDir('dist/category');
    
    // カテゴリ別に記事をグループ化
    const categoryGroups = new Map<string, Article[]>();
    
    for (const article of articles) {
      // 空のカテゴリや無効なカテゴリをスキップ
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
    
    // 各カテゴリのページを生成
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

/**
 * カテゴリ一覧ページを生成
 */
async function generateCategoryIndexPage(articles: Article[]): Promise<void> {
  try {
    log('カテゴリ一覧ページを生成中...');
    
    // カテゴリ別に記事をグループ化
    const categoryGroups = new Map<string, Article[]>();
    
    for (const article of articles) {
      // 空のカテゴリや無効なカテゴリをスキップ
      if (!article.category || article.category.trim() === '') {
        continue;
      }
      
      if (!categoryGroups.has(article.category)) {
        categoryGroups.set(article.category, []);
      }
      categoryGroups.get(article.category)!.push(article);
    }
    

    
    // カテゴリ情報を構築
    const categories = Array.from(categoryGroups.entries()).map(([name, categoryArticles]) => {
      // 最新記事を取得
      const latestArticle = categoryArticles
        .sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime())[0];
      
      return {
        name,
        count: categoryArticles.length,
        latestArticle
      };
    });
    
    // 記事数でソート（多い順）
    categories.sort((a, b) => b.count - a.count);
    
    const html = renderToHtml(CategoryIndexPage({ categories }));
    await Deno.writeTextFile('dist/category/index.html', html);
    
    log('カテゴリ一覧ページ生成完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`カテゴリ一覧ページ生成エラー: ${errorMessage}`, 'error');
  }
}

/**
 * タグページを生成
 */
async function generateTagPages(articles: Article[]): Promise<void> {
  try {
    log('タグページを生成中...');
    
    await ensureDir('dist/tags');
    
    // タグ別に記事をグループ化
    const tagGroups = new Map<string, Article[]>();
    
    for (const article of articles) {
      // 各記事のタグを処理
      for (const tag of article.tags) {
        // 空のタグや無効なタグをスキップ
        if (!tag || tag.trim() === '') {
          continue;
        }
        
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, []);
        }
        tagGroups.get(tag)!.push(article);
      }
    }
    
    // 各タグの記事を公開日降順でソート
    for (const [tag, tagArticles] of tagGroups) {
      tagArticles.sort((a, b) => 
        new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime()
      );
    }
    
    // 各タグのページを生成
    for (const [tag, tagArticles] of tagGroups) {
      const itemsPerPage = 10;
      const totalPages = Math.ceil(tagArticles.length / itemsPerPage);
      
      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageArticles = tagArticles.slice(startIndex, endIndex);
        
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        const html = renderToHtml(TagPage({
          tag,
          articles: pageArticles,
          totalCount: tagArticles.length,
          currentPage: page,
          totalPages,
          hasNextPage,
          hasPrevPage
        }));
        
        // ファイル名を生成（ページ1の場合はタグ名のみ、それ以外はページ番号付き）
        const filename = page === 1 
          ? tagToFilename(tag)
          : tagToFilename(tag).replace('.html', `-page-${page}.html`);
        
        const filepath = `dist/tags/${filename}`;
        await Deno.writeTextFile(filepath, html);
      }
    }
    
    log(`タグページ生成完了: ${tagGroups.size}タグ`, 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`タグページ生成エラー: ${errorMessage}`, 'error');
  }
}

/**
 * タグ一覧ページを生成
 */
async function generateTagIndexPage(articles: Article[]): Promise<void> {
  try {
    log('タグ一覧ページを生成中...');
    
    // タグ別に記事をグループ化
    const tagGroups = new Map<string, Article[]>();
    
    for (const article of articles) {
      // 各記事のタグを処理
      for (const tag of article.tags) {
        // 空のタグや無効なタグをスキップ
        if (!tag || tag.trim() === '') {
          continue;
        }
        
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, []);
        }
        tagGroups.get(tag)!.push(article);
      }
    }
    
    // タグ情報を構築
    const tags = Array.from(tagGroups.entries()).map(([name, tagArticles]) => {
      // 最新記事を取得
      const latestArticle = tagArticles
        .sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime())[0];
      
      return {
        name,
        count: tagArticles.length,
        latestArticle
      };
    });
    
    // 記事数でソート（多い順）
    tags.sort((a, b) => b.count - a.count);
    
    const html = renderToHtml(TagIndexPage({ tags }));
    await Deno.writeTextFile('dist/tags/index.html', html);
    
    log('タグ一覧ページ生成完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`タグ一覧ページ生成エラー: ${errorMessage}`, 'error');
  }
}

/**
 * 古い記事ファイルをクリーンアップ
 */
async function cleanupOldArticleFiles(articles: Article[]): Promise<void> {
  try {
    log('古い記事ファイルをクリーンアップ中...');
    
    const articlesDir = 'dist/articles';
    
    // 現在の記事のスラッグリストを作成
    const currentSlugs = new Set(articles.map(article => article.slug));
    
    // 既存の記事ファイルをチェック
    try {
      for await (const entry of Deno.readDir(articlesDir)) {
        if (entry.isFile && entry.name.endsWith('.html')) {
          const slug = entry.name.replace('.html', '');
          
          // 現在の記事リストに存在しない場合は削除
          if (!currentSlugs.has(slug)) {
            const filepath = `${articlesDir}/${entry.name}`;
            await Deno.remove(filepath);
            log(`古い記事ファイルを削除: ${entry.name}`, 'info');
          }
        }
      }
    } catch {
      // ディレクトリが存在しない場合は何もしない
    }
    
    log('古い記事ファイルのクリーンアップ完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`古い記事ファイルクリーンアップエラー: ${errorMessage}`, 'error');
  }
}

/**
 * 古いカテゴリファイルをクリーンアップ
 */
async function cleanupOldCategoryFiles(articles: Article[]): Promise<void> {
  try {
    log('古いカテゴリファイルをクリーンアップ中...');
    
    const categoryDir = 'dist/category';
    
    // 現在のカテゴリのファイル名リストを作成
    const currentCategoryFiles = new Set<string>();
    for (const article of articles) {
      if (article.category && article.category.trim() !== '') {
        currentCategoryFiles.add(categoryToFilename(article.category));
        // ページネーション用のファイル名も追加
        currentCategoryFiles.add(categoryToFilename(article.category).replace('.html', '-page-2.html'));
        currentCategoryFiles.add(categoryToFilename(article.category).replace('.html', '-page-3.html'));
        currentCategoryFiles.add(categoryToFilename(article.category).replace('.html', '-page-4.html'));
        currentCategoryFiles.add(categoryToFilename(article.category).replace('.html', '-page-5.html'));
      }
    }
    
    // 既存のカテゴリファイルをチェック
    try {
      for await (const entry of Deno.readDir(categoryDir)) {
        if (entry.isFile && entry.name.endsWith('.html')) {
          // index.htmlは除外
          if (entry.name === 'index.html') continue;
          
          // 現在のカテゴリファイルリストに存在しない場合は削除
          if (!currentCategoryFiles.has(entry.name)) {
            const filepath = `${categoryDir}/${entry.name}`;
            await Deno.remove(filepath);
            log(`古いカテゴリファイルを削除: ${entry.name}`, 'info');
          }
        }
      }
    } catch {
      // ディレクトリが存在しない場合は何もしない
    }
    
    log('古いカテゴリファイルのクリーンアップ完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`古いカテゴリファイルクリーンアップエラー: ${errorMessage}`, 'error');
  }
}

/**
 * 古いタグファイルをクリーンアップ
 */
async function cleanupOldTagFiles(articles: Article[]): Promise<void> {
  try {
    log('古いタグファイルをクリーンアップ中...');
    
    const tagDir = 'dist/tags';
    
    // 現在のタグのファイル名リストを作成
    const currentTagFiles = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tags) {
        if (tag && tag.trim() !== '') {
          currentTagFiles.add(tagToFilename(tag));
          // ページネーション用のファイル名も追加
          currentTagFiles.add(tagToFilename(tag).replace('.html', '-page-2.html'));
          currentTagFiles.add(tagToFilename(tag).replace('.html', '-page-3.html'));
          currentTagFiles.add(tagToFilename(tag).replace('.html', '-page-4.html'));
          currentTagFiles.add(tagToFilename(tag).replace('.html', '-page-5.html'));
        }
      }
    }
    
    // 既存のタグファイルをチェック
    try {
      for await (const entry of Deno.readDir(tagDir)) {
        if (entry.isFile && entry.name.endsWith('.html')) {
          // index.htmlは除外
          if (entry.name === 'index.html') continue;
          
          // 現在のタグファイルリストに存在しない場合は削除
          if (!currentTagFiles.has(entry.name)) {
            const filepath = `${tagDir}/${entry.name}`;
            await Deno.remove(filepath);
            log(`古いタグファイルを削除: ${entry.name}`, 'info');
          }
        }
      }
    } catch {
      // ディレクトリが存在しない場合は何もしない
    }
    
    log('古いタグファイルのクリーンアップ完了', 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`古いタグファイルクリーンアップエラー: ${errorMessage}`, 'error');
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