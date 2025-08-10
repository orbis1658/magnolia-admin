import { Handlers, PageProps } from "$fresh/server.ts";
import { Article } from "../../../types/article.ts";
import { requireAuth } from "../../../utils/auth-helper.ts";

interface Data {
  article?: Article;
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
      const { id } = ctx.params;
      const baseUrl = new URL(req.url).origin;
      const cookie = req.headers.get("cookie") || "";
      
      const response = await fetch(`${baseUrl}/api/articles/${id}`, {
        headers: {
          'Cookie': cookie,
        },
      });
      
      if (!response.ok) {
        return ctx.render({ error: "記事が見つかりません" });
      }
      
      const article = await response.json();
      return ctx.render({ article });
    } catch (error) {
      console.error("記事取得エラー:", error);
      return ctx.render({ error: "記事の取得に失敗しました" });
    }
  },

  async POST(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;
      const formData = await req.formData();
      
      const title = formData.get("title") as string;
      const slug = formData.get("slug") as string;
      const body = formData.get("body") as string;
      const category = formData.get("category") as string;
      const tags = formData.getAll("tags[]") as string[];
      const pub_date = formData.get("pub_date") as string;

      // バリデーション
      if (!title || !slug || !body) {
        // バリデーションエラーの場合、フォームデータを保持して再表示
        const tagArray = tags ? tags.filter(tag => tag.trim()) : [];
        const article = {
          id,
          title,
          slug,
          body,
          category: category || "未分類",
          tags: tagArray,
          pub_date: pub_date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return ctx.render({ 
          article, 
          error: "タイトル、スラッグ、本文は必須です" 
        });
      }

      // タグを配列に変換（空のタグを除外）
      const tagArray = tags ? tags.filter(tag => tag.trim()) : [];

      const articleData = {
        title,
        slug,
        body,
        category: category || "未分類",
        tags: tagArray,
        pub_date: pub_date || new Date().toISOString().split('T')[0],
      };

      const baseUrl = new URL(req.url).origin;
      const cookie = req.headers.get("cookie") || "";
      
      const response = await fetch(`${baseUrl}/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        // 更新成功後、更新された記事データを取得して再表示
        const updatedResponse = await fetch(`${baseUrl}/api/articles/${id}`, {
          headers: {
            'Cookie': cookie,
          },
        });
        const updatedArticle = await updatedResponse.json();
        return ctx.render({ 
          article: updatedArticle, 
          success: "記事が更新されました" 
        });
      } else {
        const error = await response.json();
        // エラーの場合、フォームデータを保持して再表示
        const article = {
          id,
          title,
          slug,
          body,
          category: category || "未分類",
          tags: tagArray,
          pub_date: pub_date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return ctx.render({ 
          article, 
          error: error.error || "記事の更新に失敗しました" 
        });
      }
    } catch (error) {
      console.error("記事更新エラー:", error);
      return ctx.render({ error: "記事の更新に失敗しました" });
    }
  },
};

export default function EditArticlePage({ data }: PageProps<Data>) {
  if (data?.error && !data?.article) {
    return (
      <div class="container mx-auto p-4">
        <div class="max-w-4xl mx-auto">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {data.error}
          </div>
          <div class="mt-4">
            <a
              href="/articles"
              class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              記事一覧に戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  const article = data?.article;

  return (
    <div class="container mx-auto p-4">
      <div class="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 class="text-2xl sm:text-3xl font-bold">記事編集</h1>
          <div class="flex gap-2">
            <a
              href={`/articles/${article?.id}`}
              class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center"
            >
              記事を表示
            </a>
            <a
              href="/articles"
              class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-center"
            >
              記事一覧に戻る
            </a>
          </div>
        </div>

        {/* エラー・成功メッセージ */}
        {data?.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {data.error}
          </div>
        )}

        {data?.success && (
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {data.success}
            <a href="/articles" class="ml-2 underline">記事一覧を見る</a>
          </div>
        )}

        {/* 記事編集フォーム */}
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <form method="POST" class="space-y-6">
            {/* タイトル */}
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={article?.title || ""}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="記事のタイトルを入力してください"
              />
            </div>

            {/* スラッグ */}
            <div>
              <label for="slug" class="block text-sm font-medium text-gray-700 mb-2">
                スラッグ *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                value={article?.slug || ""}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="url-friendly-slug"
              />
              <p class="text-sm text-gray-500 mt-1">
                URLで使用される文字列です。英数字、ハイフン、アンダースコアのみ使用してください。
              </p>
            </div>

            {/* カテゴリ */}
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={article?.category || ""}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="未分類"
              />
            </div>

            {/* タグ */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                タグ
              </label>
              <div id="tags-container" class="space-y-2">
                <div class="flex gap-2">
                  <input
                    type="text"
                    name="tags[]"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="タグを入力"
                  />
                  <button
                    type="button"
                    id="add-tag-btn"
                    class="bg-green-500 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                タグを追加するには「+」ボタンをクリックしてください。
              </p>
            </div>

            {/* 公開日 */}
            <div>
              <label for="pub_date" class="block text-sm font-medium text-gray-700 mb-2">
                公開日
              </label>
              <input
                type="date"
                id="pub_date"
                name="pub_date"
                value={article?.pub_date ? article.pub_date.split('T')[0] : new Date().toISOString().split('T')[0]}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 本文 */}
            <div>
              <label for="body" class="block text-sm font-medium text-gray-700 mb-2">
                本文 *
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={15}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="記事の本文を入力してください..."
              >{article?.body || ""}</textarea>
            </div>

            {/* ボタン */}
            <div class="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded flex-1"
              >
                記事を更新
              </button>
              <a
                href="/articles"
                class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded text-center"
              >
                キャンセル
              </a>
            </div>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // タイトルからスラッグを自動生成（スラッグが空の場合のみ）
            const titleInput = document.getElementById('title');
            const slugInput = document.getElementById('slug');
            
            titleInput.addEventListener('input', function() {
              // スラッグが手動で入力されていない場合のみ自動生成
              if (slugInput.value === '') {
                const title = this.value;
                const slug = title
                  .toLowerCase()
                  .replace(/[^a-z0-9\\s-]/g, '') // 英数字、スペース、ハイフンのみ残す
                  .replace(/\\s+/g, '-') // スペースをハイフンに変換
                  .replace(/-+/g, '-') // 連続するハイフンを1つに
                  .replace(/^-|-$/g, ''); // 先頭と末尾のハイフンを削除
                
                slugInput.value = slug;
              }
            });

            // タグ追加ボタンのイベント
            document.getElementById('add-tag-btn').addEventListener('click', addTagField);

            // 既存のタグがあれば表示
            const existingTags = ${JSON.stringify(article?.tags || [])};
            if (existingTags && Array.isArray(existingTags) && existingTags.length > 0) {
              existingTags.forEach((tag, index) => {
                if (index === 0) {
                  // 最初のタグは既存のフィールドに設定
                  const firstInput = document.querySelector('input[name="tags[]"]');
                  if (firstInput && tag) {
                    firstInput.value = tag;
                  }
                } else {
                  // 2番目以降は新しいフィールドを追加
                  if (tag) {
                    addTagField(tag);
                  }
                }
              });
            }
          });

          function addTagField(value = '') {
            // イベントオブジェクトが渡された場合は空文字列を使用
            if (value && typeof value === 'object' && value.preventDefault) {
              value = '';
            }
            
            const container = document.getElementById('tags-container');
            const tagDiv = document.createElement('div');
            tagDiv.className = 'flex gap-2';
            tagDiv.innerHTML = \`
              <input
                type="text"
                name="tags[]"
                value="\${value}"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="タグを入力"
              />
              <button
                type="button"
                onclick="removeTagField(this)"
                class="bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
              >
                -
              </button>
            \`;
            container.appendChild(tagDiv);
          }

          function removeTagField(button) {
            button.parentElement.remove();
          }
        `
      }} />
    </div>
  );
} 