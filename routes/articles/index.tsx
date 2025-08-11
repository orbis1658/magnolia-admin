import { Handlers, PageProps } from "$fresh/server.ts";
import { Article } from "../../types/article.ts";
import { requireAuth } from "../../utils/auth-helper.ts";

interface Data {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  error?: string;
  success?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const category = url.searchParams.get("category") || undefined;
      const tag = url.searchParams.get("tag") || undefined;

      const baseUrl = new URL(req.url).origin;
      const cookie = req.headers.get("cookie") || "";
      
      const response = await fetch(
        `${baseUrl}/api/articles?page=${page}&limit=${limit}${category ? `&category=${category}` : ""}${tag ? `&tag=${tag}` : ""}`,
        {
          headers: {
            "Cookie": cookie,
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("APIレスポンスエラー:", response.status, errorText);
        throw new Error(`記事の取得に失敗しました (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      const successCode = url.searchParams.get("success");
      
      // 成功メッセージコードを適切なメッセージに変換
      let successMessage: string | undefined;
      if (successCode === "created") {
        successMessage = "記事が作成されました";
      } else if (successCode === "updated") {
        successMessage = "記事が更新されました";
      } else if (successCode === "deleted") {
        successMessage = "記事が削除されました";
      }
      
      return ctx.render({
        articles: data.articles || [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        success: successMessage,
      });
    } catch (error) {
      console.error("記事一覧取得エラー:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return ctx.render({
        articles: [],
        total: 0,
        page: 1,
        limit: 10,
        error: `記事の取得に失敗しました: ${errorMessage}`,
        success: undefined,
      });
    }
  },
};

export default function ArticlesPage({ data }: PageProps<Data>) {
  const totalPages = Math.ceil(data.total / data.limit);
  const hasNextPage = data.page < totalPages;
  const hasPrevPage = data.page > 1;

  return (
    <div class="container mx-auto p-4">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold">記事一覧</h1>
        <div class="flex gap-2">
          <a
            href="/articles/new"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
          >
            新規作成
          </a>
          <a
            href="/logout"
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-center"
          >
            ログアウト
          </a>
        </div>
      </div>

      {data.error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {data.error}
        </div>
      )}

      {data.success && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {data.success}
        </div>
      )}

      {/* 統計情報 */}
      <div class="bg-gray-50 p-4 rounded mb-6">
        <p class="text-gray-600 text-center sm:text-left">
          全 {data.total} 件の記事 (ページ {data.page} / {totalPages || 1})
        </p>
      </div>

      {/* 記事一覧 */}
      <div class="space-y-4">
        {data.articles.length === 0 ? (
          <div class="text-center py-8">
            <p class="text-gray-500 text-lg">記事がありません</p>
            <a
              href="/articles/new"
              class="text-blue-500 hover:text-blue-700 mt-2 inline-block"
            >
              最初の記事を作成しましょう
            </a>
          </div>
        ) : (
          data.articles.map((article) => (
            <div key={article.id} class="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div class="flex-1">
                  <h2 class="text-lg sm:text-xl font-semibold mb-2">
                    <a
                      href={`/articles/${article.id}`}
                      class="text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </a>
                  </h2>
                  <p class="text-gray-600 text-sm mb-2">
                    スラッグ: {article.slug}
                  </p>
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                    <span>カテゴリ: {article.category}</span>
                    <span>公開日: {new Date(article.pub_date).toLocaleDateString()}</span>
                    <span>更新日: {new Date(article.updated_at).toLocaleDateString()}</span>
                  </div>
                  {article.tags.length > 0 && (
                    <div class="flex flex-wrap gap-2 mb-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          class="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p class="text-gray-700 line-clamp-3">
                    {article.body.substring(0, 200)}
                    {article.body.length > 200 && "..."}
                  </p>
                </div>
                <div class="flex gap-2 sm:ml-4">
                  <a
                    href={`/articles/${article.id}/edit`}
                    class="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-3 rounded"
                  >
                    編集
                  </a>
                  <button
                    data-article-id={article.id}
                    data-article-title={article.title}
                    class="delete-article bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div class="flex justify-center items-center gap-2 mt-8">
          {hasPrevPage && (
            <a
              href={`/articles?page=${data.page - 1}`}
              class="bg-gray-500 hover:bg-gray-700 text-white px-3 py-2 rounded"
            >
              前へ
            </a>
          )}
          
          <span class="px-3 py-2">
            {data.page} / {totalPages}
          </span>
          
          {hasNextPage && (
            <a
              href={`/articles?page=${data.page + 1}`}
              class="bg-gray-500 hover:bg-gray-700 text-white px-3 py-2 rounded"
            >
              次へ
            </a>
          )}
        </div>
      )}

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // 記事削除ボタン
            document.querySelectorAll('.delete-article').forEach(function(button) {
              button.addEventListener('click', async function() {
                const articleId = this.getAttribute('data-article-id');
                const articleTitle = this.getAttribute('data-article-title');
                
                if (!confirm('記事「' + articleTitle + '」を削除しますか？')) {
                  return;
                }

                try {
                  const response = await fetch('/api/articles/' + articleId, {
                    method: 'DELETE',
                  });

                  if (response.ok) {
                    alert('記事が削除されました');
                    window.location.reload();
                  } else {
                    const error = await response.json();
                    alert('エラー: ' + error.error);
                  }
                } catch (error) {
                  alert('エラー: ' + error);
                }
              });
            });
          });
        `
      }} />
    </div>
  );
} 