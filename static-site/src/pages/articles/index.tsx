import { h } from "preact";
import { BaseLayout } from "../../layouts/base.tsx";
import { ArticleCard } from "../../components/ArticleCard.tsx";
import { Article } from "../../../build/builder.ts";
import { categoryToSlug, tagToSlug } from "../../../build/utils.ts";

interface ArticlesIndexPageData {
  articles: Article[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  categories: { name: string; count: number }[];
  popularTags: { name: string; count: number }[];
}

interface BreadcrumbItem {
  name: string;
  href: string;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav class="text-sm text-gray-600 mb-6">
      <ol class="flex items-center space-x-2">
        {items.map((item, index) => (
          <>
            <li>
              <a 
                href={item.href} 
                class="hover:text-blue-600 transition-colors"
              >
                {item.name}
              </a>
            </li>
            {index < items.length - 1 && (
              <li class="text-gray-400">/</li>
            )}
          </>
        ))}
      </ol>
    </nav>
  );
}

function Pagination({ 
  currentPage, 
  totalPages, 
  baseUrl,
  hasNextPage,
  hasPrevPage
}: { 
  currentPage: number; 
  totalPages: number; 
  baseUrl: string;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}) {
  if (totalPages <= 1) return null;

  const generatePageUrl = (page: number) => {
    return page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
  };

  return (
    <nav class="flex justify-center items-center space-x-2 mt-8">
      {/* 前のページ */}
      {hasPrevPage && (
        <a 
          href={generatePageUrl(currentPage - 1)}
          class="px-3 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
        >
          ← 前のページ
        </a>
      )}

      {/* ページ番号 */}
      <div class="flex space-x-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <a
            key={page}
            href={generatePageUrl(page)}
            class={`px-3 py-2 text-sm border rounded transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            {page}
          </a>
        ))}
      </div>

      {/* 次のページ */}
      {hasNextPage && (
        <a 
          href={generatePageUrl(currentPage + 1)}
          class="px-3 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
        >
          次のページ →
        </a>
      )}
    </nav>
  );
}

export function ArticlesIndexPage({ 
  articles, 
  currentPage, 
  totalPages,
  hasNextPage,
  hasPrevPage,
  categories,
  popularTags
}: ArticlesIndexPageData) {
  const title = "記事一覧 | magnolia";
  const description = "magnoliaの記事一覧です。";

  return (
    <BaseLayout title={title} description={description}>
      <div class="container mx-auto px-4 py-8">
        <Breadcrumb items={[
          { name: "ホーム", href: "/magnolia/" },
          { name: "記事一覧", href: "/magnolia/articles" }
        ]} />
        
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            記事一覧
          </h1>
          <p class="text-gray-600">
            {articles.length}件の記事
            {currentPage > 1 && ` (${currentPage}ページ目)`}
          </p>
        </div>
        
        <div class="grid lg:grid-cols-4 gap-8">
          {/* メインコンテンツ */}
          <div class="lg:col-span-3">
            {articles.length === 0 ? (
              <div class="text-center py-12">
                <p class="text-gray-500 text-lg">
                  記事がありません。
                </p>
                <a 
                  href="/magnolia/" 
                  class="text-blue-600 hover:text-blue-800 mt-4 inline-block"
                >
                  ホームに戻る
                </a>
              </div>
            ) : (
              <>
                <div class="space-y-6">
                  {articles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="/magnolia/articles"
                  hasNextPage={hasNextPage}
                  hasPrevPage={hasPrevPage}
                />
              </>
            )}
          </div>

          {/* サイドバー */}
          <div class="space-y-8">
            {/* カテゴリ */}
            <div class="bg-white p-6 rounded-lg shadow-sm border">
              <h3 class="text-xl font-semibold mb-4">カテゴリ</h3>
              <div class="space-y-2">
                {categories.map(({ name, count }) => (
                  <a 
                    href={`/magnolia/category/${categoryToSlug(name)}.html`}
                    class="flex justify-between items-center text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <span>{name}</span>
                    <span class="bg-gray-100 px-2 py-1 rounded text-sm">{count}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 人気タグ */}
            <div class="bg-white p-6 rounded-lg shadow-sm border">
              <h3 class="text-xl font-semibold mb-4">人気タグ</h3>
              <div class="flex flex-wrap gap-2">
                {popularTags.map(({ name, count }) => (
                  <a 
                    href={`/magnolia/tags/${tagToSlug(name)}.html`}
                    class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    #{name} ({count})
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