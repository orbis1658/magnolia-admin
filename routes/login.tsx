import { Handlers, PageProps } from "$fresh/server.ts";
import { authenticateUser, createSession, initializeAdminUser } from "../utils/auth.ts";
import { setSessionCookie } from "../utils/middleware.ts";

interface Data {
  error?: string;
  success?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    // 管理者ユーザーを初期化
    await initializeAdminUser();
    return ctx.render({});
  },

  async POST(req, ctx) {
    try {
      const formData = await req.formData();
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      if (!username || !password) {
        return ctx.render({ error: "ユーザー名とパスワードを入力してください" });
      }

      // ユーザー認証
      const user = await authenticateUser(username, password);

      if (!user) {
        return ctx.render({ error: "ユーザー名またはパスワードが正しくありません" });
      }

      // セッションを作成
      const session = await createSession(user.id, user.username);

      // ログイン成功、記事一覧ページにリダイレクト
      const response = new Response(null, {
        status: 302,
        headers: {
          "Location": "/articles",
        },
      });

      // セッションCookieを設定
      const cookieValue = setSessionCookie(session.id);
      response.headers.set("Set-Cookie", cookieValue);

      return response;
    } catch (error) {
      console.error("ログインエラー:", error);
      return ctx.render({ error: "ログイン処理中にエラーが発生しました" });
    }
  },
};

export default function LoginPage({ data }: PageProps<Data>) {
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理者ログイン
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            magnolia記事管理システム
          </p>
        </div>
        
        <form class="mt-8 space-y-6" method="POST">
          {data?.error && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {data.error}
            </div>
          )}
          
          {data?.success && (
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {data.success}
            </div>
          )}
          
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="username" class="sr-only">ユーザー名</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ユーザー名"
              />
            </div>
            <div>
              <label for="password" class="sr-only">パスワード</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ログイン
            </button>
          </div>
        </form>
        
        <div class="text-center">
          
        </div>
      </div>
    </div>
  );
} 