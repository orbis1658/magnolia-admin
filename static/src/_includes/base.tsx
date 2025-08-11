import { Head } from 'lume/plugins/jsx.ts';

interface BaseLayoutProps {
  title: string;
  description?: string;
  children: any;
  url?: string;
}

export default function BaseLayout({ title, description, children, url }: BaseLayoutProps) {
  const siteTitle = 'Magnolia Blog';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const metaDescription = description || 'Magnoliaブログへようこそ。技術記事や日常の記録を共有しています。';
  const canonicalUrl = url ? `https://example.com${url}` : 'https://example.com';

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{fullTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={metaDescription} />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Styles */}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <a href="/" className="text-2xl font-bold text-primary-600">
                    {siteTitle}
                  </a>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    ホーム
                  </a>
                  <a href="/categories" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    カテゴリ
                  </a>
                  <a href="/tags" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    タグ
                  </a>
                  <a href="/archive" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    アーカイブ
                  </a>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-gray-500">
                  © {new Date().getFullYear()} {siteTitle}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
} 