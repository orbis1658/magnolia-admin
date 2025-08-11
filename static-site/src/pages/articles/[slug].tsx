import { h } from "preact";
import { BaseLayout } from "../../layouts/base.tsx";
import { Article } from "../../../build/builder.ts";

interface ArticlePageProps {
  article: Article;
  relatedArticles?: Article[];
}

export function ArticlePage({ article, relatedArticles = [] }: ArticlePageProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <BaseLayout 
      title={article.title}
      description={article.body.length > 160 ? article.body.substring(0, 160) + '...' : article.body}
      keywords={article.tags.join(', ')}
    >
      <div class="container mx-auto px-4 py-8">
        <article class="max-w-4xl mx-auto">
          {/* パンくずリスト */}
          <nav class="mb-6">
            <ol class="flex items-center space-x-2 text-sm text-gray-600">
              <li><a href="/magnolia/" class="hover:text-blue-600">ホーム</a></li>
              <li>/</li>
              <li><a href="/magnolia/articles" class="hover:text-blue-600">記事</a></li>
              <li>/</li>
              <li class="text-gray-900">{article.title}</li>
            </ol>
          </nav>

          {/* 記事ヘッダー */}
          <header class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            
            <div class="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
              <div class="flex items-center">
                <span class="mr-2">📅</span>
                <time datetime={article.pub_date}>
                  {formatDate(article.pub_date)}
                </time>
              </div>
              
              <div class="flex items-center">
                <span class="mr-2">📂</span>
                <a 
                  href={`/magnolia/category/${article.category}.html`}
                  class="hover:text-blue-600 transition-colors"
                >
                  {article.category}
                </a>
              </div>
            </div>

            {article.tags.length > 0 && (
              <div class="flex flex-wrap gap-2 mb-6">
                {article.tags.map(tag => (
                  <a 
                    href={`/magnolia/tags/${tag}.html`}
                    class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </header>

          {/* 記事本文 */}
          <div class="prose max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: article.body }} />
          </div>

          {/* 関連記事 */}
          {relatedArticles.length > 0 && (
            <section class="mt-12 pt-8 border-t">
              <h2 class="text-2xl font-bold mb-6">関連記事</h2>
              <div class="grid md:grid-cols-2 gap-6">
                {relatedArticles.slice(0, 4).map(relatedArticle => (
                  <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 class="text-lg font-semibold mb-2">
                      <a 
                        href={`/magnolia/articles/${relatedArticle.slug}.html`}
                        class="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {relatedArticle.title}
                      </a>
                    </h3>
                    <p class="text-gray-600 text-sm mb-2">
                      {formatDate(relatedArticle.pub_date)}
                    </p>
                    <p class="text-gray-700 text-sm">
                      {relatedArticle.body.length > 100 
                        ? `${relatedArticle.body.substring(0, 100)}...` 
                        : relatedArticle.body
                      }
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ナビゲーション */}
          <footer class="mt-12 pt-8 border-t">
            <div class="flex justify-between items-center">
              <a 
                href="/magnolia/" 
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← ホームに戻る
              </a>
              
              <div class="flex space-x-4">
                <a 
                  href={`/magnolia/category/${article.category}.html`}
                  class="text-gray-600 hover:text-blue-600"
                >
                  カテゴリ: {article.category}
                </a>
                {article.tags.length > 0 && (
                  <a 
                    href={`/magnolia/tags/${article.tags[0]}.html`}
                    class="text-gray-600 hover:text-blue-600"
                  >
                    タグ: {article.tags[0]}
                  </a>
                )}
              </div>
            </div>
          </footer>
        </article>
      </div>
    </BaseLayout>
  );
} 