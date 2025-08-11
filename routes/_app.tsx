import { type PageProps } from "$fresh/server.ts";

export default function App({ Component, error }: PageProps) {
  const errorObj = error as any;
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Magnolia 記事管理システム</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {errorObj ? (
          <div class="min-h-screen bg-gray-100 flex items-center justify-center">
            <div class="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
              <h1 class="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
              <div class="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p class="text-red-800 font-semibold">エラー詳細:</p>
                <pre class="text-red-700 text-sm mt-2 whitespace-pre-wrap">{errorObj.message}</pre>
                {errorObj.stack && (
                  <details class="mt-2">
                    <summary class="text-red-700 text-sm cursor-pointer">スタックトレース</summary>
                    <pre class="text-red-600 text-xs mt-1 whitespace-pre-wrap">{errorObj.stack}</pre>
                  </details>
                )}
              </div>
              <a
                href="/"
                class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        ) : (
          <Component />
        )}
      </body>
    </html>
  );
}
