import { h } from "preact";

interface BaseLayoutProps {
  title: string;
  description?: string;
  keywords?: string;
  children: any;
}

export function BaseLayout({ title, description, keywords, children }: BaseLayoutProps) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        <link rel="stylesheet" href="/assets/css/styles.css" />
      </head>
      <body>
        <header class="bg-white shadow-sm border-b">
          <div class="container mx-auto px-4 py-4">
            <nav class="flex items-center justify-between">
              <a href="/" class="text-2xl font-bold text-gray-900 hover:text-blue-600">
                Magnolia Blog
              </a>
              <div class="hidden md:flex space-x-6">
                <a href="/" class="text-gray-600 hover:text-blue-600">ホーム</a>
                <a href="/category" class="text-gray-600 hover:text-blue-600">カテゴリ</a>
                <a href="/tags" class="text-gray-600 hover:text-blue-600">タグ</a>
              </div>
            </nav>
          </div>
        </header>

        <main>
          {children}
        </main>

        <footer class="bg-gray-50 border-t mt-16">
          <div class="container mx-auto px-4 py-8">
            <div class="text-center text-gray-600">
              <p>&copy; 2024 Magnolia Blog. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
} 