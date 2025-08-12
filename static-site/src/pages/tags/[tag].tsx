import { h } from "preact";
import { BaseLayout } from "../../layouts/base.tsx";
import { ArticleCard } from "../../components/ArticleCard.tsx";
import { Article } from "../../../build/builder.ts";
import { tagToSlug } from "../../../build/utils.ts";

interface TagPageData {
  tag: string;
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
    return page === 1 ? baseUrl : `${baseUrl.replace('.html', '')}?page=${page}`;
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

export function TagPage({ 
  tag, 
  articles, 
  currentPage, 
  totalPages,
  hasNextPage,
  hasPrevPage
}: TagPageData) {
  const title = `#${tag} - 記事一覧 | magnolia`;
  const description = `#${tag}に関する記事一覧です。${articles.length}件の記事があります。`;

  return (
    <BaseLayout title={title} description={description}>
      <div class="container mx-auto px-4 py-8">
        <Breadcrumb items={[
          { name: "ホーム", href: "/magnolia/" },
          { name: "タグ", href: "/magnolia/tags" },
          { name: `#${tag}`, href: `/magnolia/tags/${tagToSlug(tag)}.html` }
        ]} />
        
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            #{tag}
          </h1>
          <p class="text-gray-600">
            {articles.length}件の記事
          </p>
        </div>
        
        {articles.length === 0 ? (
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">
              このタグには記事がありません。
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
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={`/magnolia/tags/${tagToSlug(tag)}.html`}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
            />
          </>
        )}
      </div>
    </BaseLayout>
  );
} 