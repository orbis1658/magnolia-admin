import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth-helper.ts";
import { getArticles } from "../../utils/kv.ts";
import { ArticleListResponse } from "../../types/article.ts";

interface Data extends ArticleListResponse {
  error?: string;
  success?: string;
}

// HTMLタグを除去し、<br>タグを改行に変換する関数
function stripHtmlAndConvertBreaks(html: string): string {
  // <br>タグを改行文字に変換
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  // その他のHTMLタグを除去
  text = text.replace(/<[^>]*>/g, '');
  // HTMLエンティティをデコード
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  return text;
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
      const success = url.searchParams.get("success");
      const error = url.searchParams.get("error");

      // KVから記事を取得
      const result = await getArticles(page, limit, category, tag);
      
      const data: Data = {
        articles: result.articles,
        total: result.total,
        page,
        limit,
        success: success || undefined,
        error: error || undefined,
      };

      return ctx.render(data);
    } catch (error) {
      console.error("記事一覧取得エラー:", error);
      return ctx.render({ 
        articles: [], 
        total: 0, 
        page: 1, 
        limit: 10,
        error: "記事の取得に失敗しました" 
      });
    }
  },
};

export default function ArticlesPage({ data }: PageProps<Data>) {
  const totalPages = Math.ceil(data.total / data.limit);
  const hasPrevPage = data.page > 1;
  const hasNextPage = data.page < totalPages;

  return (
    <div class="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">記事管理</h1>
        <div class="flex gap-4">
          <a
            href="/articles/new"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            新規作成
          </a>
          <button
            id="buildButton"
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            静的サイトをビルド
          </button>
        </div>
      </div>

      {/* 成功・エラーメッセージ */}
      {data.success && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {data.success === "created" && "記事が作成されました！"}
          {data.success === "updated" && "記事が更新されました！"}
          {data.success === "deleted" && "記事が削除されました！"}
          {data.success === "built" && "静的サイトのビルドが完了しました！"}
        </div>
      )}

      {data.error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {data.error}
        </div>
      )}

      {/* 記事一覧 */}
      <div class="space-y-6">
        {data.articles.length === 0 ? (
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">記事がありません</p>
            <a
              href="/articles/new"
              class="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              最初の記事を作成
            </a>
          </div>
        ) : (
          data.articles.map((article) => {
            const plainTextBody = stripHtmlAndConvertBreaks(article.body);
            const displayText = plainTextBody.length > 200 
              ? `${plainTextBody.substring(0, 200)}...` 
              : plainTextBody;
            
            return (
              <div key={article.id} class="bg-white border rounded-lg p-6 shadow-sm">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex-1">
                    <h2 class="text-xl font-semibold mb-2">
                      <a
                        href={`/articles/${article.id}/edit`}
                        class="text-blue-600 hover:text-blue-800"
                      >
                        {article.title}
                      </a>
                    </h2>
                    <div class="text-sm text-gray-500 mb-3">
                      <span>スラッグ: {article.slug}</span>
                      <span class="mx-2">|</span>
                      <span>カテゴリ: {article.category}</span>
                      <span class="mx-2">|</span>
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
                    <p class="text-gray-700 line-clamp-3 whitespace-pre-line">
                      {displayText}
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
            );
          })
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
                  // ページ数を表示する機能を削除
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
                    const result = await response.json();
                    
                    if (result.workflowTriggered) {
                      alert('記事が削除されました！\\n\\n✅ データベースから削除完了\\n✅ 静的ファイルから削除完了\\n✅ GitHub Actionsでレンタルサーバーからも削除中\\n\\nGitHubのActionsタブで進捗を確認できます。');
                    } else {
                      alert('記事が削除されました！\\n\\n✅ データベースから削除完了\\n✅ 静的ファイルから削除完了\\n⚠️ レンタルサーバーの更新に失敗\\n\\nエラー: ' + (result.workflowError || '不明'));
                    }
                    
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
            document.getElementById('buildButton').addEventListener('click', async function() {
              const button = this;
              const originalText = button.textContent;
              
              // GitHub Actionsをトリガーするかどうか確認
              const useGitHubActions = confirm('ページを公開しますか？\\n\\n「OK」: レンタルサーバーに公開\\n「キャンセル」: ローカルでビルドのみ');
              
              button.disabled = true;
              button.textContent = useGitHubActions ? '公開中...' : 'ビルド中...';
              button.className = 'bg-yellow-500 text-white font-bold py-2 px-4 rounded text-center cursor-not-allowed';

              try {
                const response = await fetch('/api/build', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    trigger_github_actions: useGitHubActions
                  })
                });

                const result = await response.json();

                if (result.success) {
                  if (useGitHubActions) {
                    const message = \`ページの公開が開始されました！\\n\\nレンタルサーバーにアップロード中です。\\n完了まで数分かかる場合があります。\`;
                    alert(message);
                    button.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center';
                    button.textContent = '公開済み';
                  } else {
                    const message = \`ページのビルドが完了しました！\\n\\nビルド時間: \${result.buildTime ? Math.round(result.buildTime / 1000) : 0}秒\`;
                    alert(message);
                    button.className = 'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center';
                  }
                } else {
                  const errorMessage = result.error || result.message || '不明なエラー';
                  alert('ページの公開に失敗しました:\\n' + errorMessage);
                  button.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center';
                }
              } catch (error) {
                alert('ページの公開プロセスに失敗しました:\\n' + error);
                button.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center';
              } finally {
                if (!useGitHubActions) {
                  button.disabled = false;
                  button.textContent = originalText;
                }
              }
            });
          });
        `
      }} />
    </div>
  );
} 