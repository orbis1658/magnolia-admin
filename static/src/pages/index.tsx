import BaseLayout from '../_includes/base.tsx';
import ArticleCard from '../components/ArticleCard.tsx';

interface PageData {
  articles: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function HomePage({ articles, pagination }: PageData) {
  const hasNextPage = pagination.page < pagination.pages;
  const hasPrevPage = pagination.page > 1;

  return (
    <BaseLayout title="Magnolia Blog" description="技術記事や日常の記録を共有しています">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヒーローセクション */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Magnolia Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            技術記事や日常の記録を共有しています。新しい発見や学びを共有していきます。
          </p>
        </div>

        {/* 記事一覧 */}
        {articles && articles.length > 0 ? (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* ページネーション */}
            {pagination.pages > 1 && (
              <div className="flex justify-center">
                <nav className="pagination" aria-label="ページネーション">
                  {/* 前のページ */}
                  {hasPrevPage ? (
                    <a
                      href={pagination.page === 2 ? '/' : `/page/${pagination.page - 1}/`}
                      className="pagination-link"
                    >
                      前へ
                    </a>
                  ) : (
                    <span className="pagination-link disabled">前へ</span>
                  )}

                  {/* ページ番号 */}
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                    <a
                      key={pageNum}
                      href={pageNum === 1 ? '/' : `/page/${pageNum}/`}
                      className={`pagination-link ${
                        pageNum === pagination.page ? 'active' : ''
                      }`}
                    >
                      {pageNum}
                    </a>
                  ))}

                  {/* 次のページ */}
                  {hasNextPage ? (
                    <a
                      href={`/page/${pagination.page + 1}/`}
                      className="pagination-link"
                    >
                      次へ
                    </a>
                  ) : (
                    <span className="pagination-link disabled">次へ</span>
                  )}
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              記事が見つかりません
            </h3>
            <p className="text-gray-500">
              まだ記事が投稿されていません。
            </p>
          </div>
        )}
      </div>
    </BaseLayout>
  );
} 