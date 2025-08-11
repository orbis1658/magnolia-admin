import lume from "https://deno.land/x/lume@v2.0.0/mod.ts";
import nunjucks from "https://deno.land/x/lume@v2.0.0/plugins/nunjucks.ts";
import postcss from "https://deno.land/x/lume@v2.0.0/plugins/postcss.ts";
import tailwindcss from "npm:tailwindcss@^3.4.0";
import autoprefixer from "npm:autoprefixer@^10.4.0";

// データ取得プラグイン
const fetchArticles = () => {
  return (site: any) => {
    site.data('articles', async () => {
      try {
        // admin/APIから記事データを取得
        const apiUrl = Deno.env.get('LUME_API_URL') || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/articles`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.articles || [];
      } catch (error) {
        console.error('記事データの取得に失敗しました:', error);
        // デフォルトのサンプルデータを返す
        return [
          {
            id: '1',
            slug: 'sample-article',
            title: 'サンプル記事',
            pub_date: new Date().toISOString(),
            category: '技術',
            tags: ['サンプル', 'テスト'],
            body: 'これはサンプル記事です。実際の記事データを取得できなかった場合に表示されます。',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];
      }
    });
  };
};

// サイト設定
const site = lume({
  src: './src',
  dest: './dist',
  location: new URL('https://example.com'),
  prettyUrls: true,
});

// プラグインの追加
site.use(nunjucks());
site.use(postcss({
  plugins: [tailwindcss, autoprefixer],
}));
site.use(fetchArticles());

// 静的ファイルのコピー
site.copy('public', '.');

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

export default site; 