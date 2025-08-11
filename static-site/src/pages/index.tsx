import { h } from "preact";
import { BaseLayout } from "../layouts/base.tsx";
import { ArticleCard } from "../components/ArticleCard.tsx";
import { Article } from "../../build/builder.ts";

interface IndexPageProps {
  articles: Article[];
}

export function IndexPage({ articles }: IndexPageProps) {
  // 最新の記事を5件取得
  const recentArticles = articles
    .sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime())
    .slice(0, 5);

  // カテゴリ別記事数を集計
  const categoryCounts = articles.reduce((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 人気タグを集計
  const tagCounts = articles.reduce((acc, article) => {
    article.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const popularTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <BaseLayout 
      title="Magnolia Blog - ホーム"
      description="Magnoliaブログの最新記事一覧"
    >
      <div class="container mx-auto px-4 py-8">
        {/* ヒーローセクション */}
        <section class="text-center mb-12">
          <h1 class="text-5xl font-bold text-gray-900 mb-4">
            Magnolia Blog
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            技術、ライフスタイル、そして日常の気づきを共有するブログです
          </p>
        </section>

        <div class="grid lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div class="lg:col-span-2">
            <h2 class="text-3xl font-bold mb-6">最新記事</h2>
            <div class="space-y-6">
              {recentArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            {articles.length > 5 && (
              <div class="mt-8 text-center">
                <a 
                  href="/articles" 
                  class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  すべての記事を見る
                </a>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div class="space-y-8">
            {/* カテゴリ */}
            <div class="bg-white p-6 rounded-lg shadow-sm border">
              <h3 class="text-xl font-semibold mb-4">カテゴリ</h3>
              <div class="space-y-2">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <a 
                    href={`/category/${category}.html`}
                    class="flex justify-between items-center text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <span>{category}</span>
                    <span class="bg-gray-100 px-2 py-1 rounded text-sm">{count}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 人気タグ */}
            <div class="bg-white p-6 rounded-lg shadow-sm border">
              <h3 class="text-xl font-semibold mb-4">人気タグ</h3>
              <div class="flex flex-wrap gap-2">
                {popularTags.map(([tag, count]) => (
                  <a 
                    href={`/tags/${tag}.html`}
                    class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    #{tag} ({count})
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
} 