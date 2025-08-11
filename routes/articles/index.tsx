import { Handlers, PageProps } from "$fresh/server.ts";
import { Article } from "../../types/article.ts";
import { requireAuth } from "../../utils/auth-helper.ts";
import { getArticles } from "../../utils/kv.ts";

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

      // 直接KVから記事を取得
      const result = await getArticles(page, limit, category, tag);
      
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
        articles: result.articles || [],
        total: result.total || 0,
        page: page,
        limit: limit,
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
          <button
            id="buildBtn"
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center"
          >
            静的サイトをビルド
          </button>
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
            // ビルド状況を取得
            async function loadBuildStatus() {
              try {
                const response = await fetch('/api/build', {
                  method: 'GET'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success && result.generatedPages > 0) {
                    const buildBtn = document.getElementById('buildBtn');
                    buildBtn.textContent = \`静的サイトをビルド (\${result.generatedPages}ページ)\`;
                  }
                }
              } catch (error) {
                console.log('ビルド状況の取得に失敗:', error);
              }
            }
            
            // ページ読み込み時にビルド状況を取得
            loadBuildStatus();
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

            // 静的サイトビルドボタン
            document.getElementById('buildBtn').addEventListener('click', async function() {
              const button = this;
              const originalText = button.textContent;
              
              button.disabled = true;
              button.textContent = 'ビルド中...';
              button.className = 'bg-yellow-500 text-white font-bold py-2 px-4 rounded text-center cursor-not-allowed';

              try {
                const response = await fetch('/api/build', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({})
                });

                const result = await response.json();

                if (result.success) {
                  const message = \`静的サイトのビルドが完了しました！\\n\\n生成ページ数: \${result.generatedPages || 0}件\\nビルド時間: \${result.buildTime ? Math.round(result.buildTime / 1000) : 0}秒\`;
                  alert(message);
                  button.className = 'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center';
                } else {
                  const errorMessage = result.error || result.message || '不明なエラー';
                  alert('ビルドに失敗しました:\\n' + errorMessage);
                  button.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center';
                }
              } catch (error) {
                alert('ビルドプロセスの実行に失敗しました:\\n' + error);
                button.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center';
              } finally {
                button.disabled = false;
                button.textContent = originalText;
              }
            });
          });
        `
      }} />
    </div>
  );
} 