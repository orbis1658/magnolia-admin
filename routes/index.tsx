import { Handlers } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth-helper.ts";

interface Data {
  user?: any;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    return ctx.render({ user: authResult.user });
  },
};

export default function Home({ data }: { data: Data }) {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header class="bg-white shadow-sm border-b">
        <div class="container mx-auto px-4 py-4">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">Magnolia 記事管理</h1>
            <nav class="flex space-x-4">
              <a
                href="/articles"
                class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                記事一覧
              </a>
              <a
                href="/articles/new"
                class="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                新規作成
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-4xl font-bold text-gray-900 mb-4">
              Magnolia 記事管理システム
            </h2>
            <p class="text-xl text-gray-600 mb-8">
              ブログ記事の作成、編集、管理を行います
            </p>
          </div>

          {/* クイックアクション */}
          <div class="grid md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-sm border">
              <h3 class="text-lg font-semibold mb-3">記事一覧</h3>
              <p class="text-gray-600 mb-4">
                作成済みの記事を一覧で確認し、編集や削除を行います。
              </p>
              <a
                href="/articles"
                class="inline-block bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                記事一覧を見る
              </a>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-sm border">
              <h3 class="text-lg font-semibold mb-3">新規作成</h3>
              <p class="text-gray-600 mb-4">
                新しい記事を作成します。タイトル、本文、カテゴリ、タグを設定できます。
              </p>
              <a
                href="/articles/new"
                class="inline-block bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                記事を作成
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
