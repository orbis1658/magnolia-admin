import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth-helper.ts";
import { getArticles } from "../utils/kv.ts";

interface Data {
  articles: any[];
  error?: string;
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
      const result = await getArticles(1, 10);
      return ctx.render({ articles: result.articles });
    } catch (error) {
      console.error("記事取得エラー:", error);
      return ctx.render({ articles: [], error: "記事の取得に失敗しました" });
    }
  },
};

export default function ApiTestPage({ data }: PageProps<Data>) {
  return (
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-6">API テストページ</h1>
      
      <div class="mb-6">
        <button
          id="createTestArticle"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          テスト記事を作成
        </button>
      </div>

      {data.error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {data.error}
        </div>
      )}

      <div class="space-y-4">
        <h2 class="text-xl font-semibold">記事一覧</h2>
        {data.articles.length === 0 ? (
          <p class="text-gray-500">記事がありません</p>
        ) : (
          data.articles.map((article) => {
            const plainTextBody = stripHtmlAndConvertBreaks(article.body);
            const displayText = plainTextBody.length > 100 
              ? `${plainTextBody.substring(0, 100)}...` 
              : plainTextBody;
            
            return (
              <div key={article.id} class="border p-4 rounded">
                <h3 class="text-lg font-semibold">{article.title}</h3>
                <p class="text-gray-600 text-sm">スラッグ: {article.slug}</p>
                <p class="text-gray-600 text-sm">カテゴリ: {article.category}</p>
                <p class="text-gray-600 text-sm">タグ: {article.tags.join(', ')}</p>
                <p class="mt-2 whitespace-pre-line">{displayText}</p>
                <div class="mt-2">
                  <button
                    data-article-id={article.id}
                    class="delete-article bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // テスト記事作成ボタン
            document.getElementById('createTestArticle').addEventListener('click', async function() {
              console.log("=== テスト記事作成開始 ===");
              
              const testArticle = {
                title: 'テスト記事 ' + new Date().toLocaleString(),
                slug: 'test-article-' + Date.now(),
                body: 'これはテスト記事の本文です。',
                category: 'テスト',
                tags: ['テスト', 'API']
              };

              console.log("送信するデータ:", testArticle);

              try {
                console.log("fetchリクエストを送信中...");
                const response = await fetch('/api/articles', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(testArticle),
                });

                console.log("レスポンスステータス:", response.status);

                if (response.ok) {
                  const result = await response.json();
                  console.log("成功:", result);
                  console.log("ページをリロードします...");
                  alert("記事が作成されました！ページをリロードします。");
                  window.location.reload();
                } else {
                  const error = await response.json();
                  console.error("エラー:", error);
                  alert('エラー: ' + error.error);
                }
              } catch (error) {
                console.error("例外エラー:", error);
                alert('エラー: ' + error);
              }
            });

            // 記事削除ボタン
            document.querySelectorAll('.delete-article').forEach(function(button) {
              button.addEventListener('click', async function() {
                const articleId = this.getAttribute('data-article-id');
                if (!confirm('この記事を削除しますか？')) return;

                try {
                  const response = await fetch('/api/articles/' + articleId, {
                    method: 'DELETE',
                  });

                  if (response.ok) {
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