import lume from 'https://deno.land/x/lume@v2.0.0/mod.ts';
import jsx from 'https://deno.land/x/lume@v2.0.0/plugins/jsx.ts';
import postcss from 'https://deno.land/x/lume@v2.0.0/plugins/postcss.ts';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// データ取得プラグイン
const fetchArticles = () => {
  return (site: any) => {
    site.data('articles', async () => {
      try {
        // admin/APIから記事データを取得
        const response = await fetch('http://localhost:8000/api/articles');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.articles || [];
      } catch (error) {
        console.error('記事データの取得に失敗しました:', error);
        return [];
      }
    });

    // カテゴリとタグの集計
    site.data('categories', async (site: any) => {
      const articles = await site.data('articles');
      const categories = new Set();
      articles.forEach((article: any) => {
        if (article.category) {
          categories.add(article.category);
        }
      });
      return Array.from(categories);
    });

    site.data('tags', async (site: any) => {
      const articles = await site.data('articles');
      const tags = new Set();
      articles.forEach((article: any) => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      return Array.from(tags);
    });
  };
};

// サイト設定
const site = lume({
  src: './src',
  dest: './dist',
  location: new URL('https://example.com'), // 本番URLに変更
  prettyUrls: true,
  server: {
    port: 3000,
    open: true,
  },
});

// プラグインの追加
site.use(jsx());
site.use(postcss({
  plugins: [tailwindcss, autoprefixer],
}));
site.use(fetchArticles());

// 静的ファイルのコピー
site.copy('public', '.');

// ページネーション設定
site.data('pagination', {
  articles: {
    size: 10,
    url: (n: number) => n === 1 ? '/' : `/page/${n}/`,
  },
  categories: {
    size: 10,
    url: (n: number, category: string) => 
      n === 1 ? `/categories/${category}/` : `/categories/${category}/page/${n}/`,
  },
  tags: {
    size: 10,
    url: (n: number, tag: string) => 
      n === 1 ? `/tags/${tag}/` : `/tags/${tag}/page/${n}/`,
  },
});

// カスタムフィルター
site.filter('formatDate', (date: string) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

site.filter('excerpt', (text: string, length: number = 150) => {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
});

// サイトマップ生成
site.process(['.html'], (page) => {
  if (page.data.sitemap !== false) {
    page.data.sitemap = {
      changefreq: 'weekly',
      priority: page.data.url === '/' ? 1 : 0.8,
    };
  }
});

export default site; 