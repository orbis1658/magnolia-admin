import { renderToString } from "https://esm.sh/preact-render-to-string@6.2.2";
import { h } from "https://esm.sh/preact@10.19.6";

/**
 * JSXコンポーネントをHTML文字列に変換
 */
export function renderToHtml(component: any): string {
  try {
    return renderToString(component);
  } catch (error) {
    console.error('JSXレンダリングエラー:', error);
    return '<div>レンダリングエラーが発生しました</div>';
  }
}

/**
 * HTMLドキュメントの完全な構造を生成
 */
export function renderDocument(
  title: string,
  content: string,
  options: {
    description?: string;
    keywords?: string;
    css?: string[];
    js?: string[];
  } = {}
): string {
  const { description = '', keywords = '', css = [], js = [] } = options;
  
  const cssLinks = css.map(href => `<link rel="stylesheet" href="${href}">`).join('\n    ');
  const jsScripts = js.map(src => `<script src="${src}"></script>`).join('\n    ');
  
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${description ? `<meta name="description" content="${description}">` : ''}
    ${keywords ? `<meta name="keywords" content="${keywords}">` : ''}
    ${cssLinks}
</head>
<body>
    ${content}
    ${jsScripts}
</body>
</html>`;
}

/**
 * メタタグを生成
 */
export function generateMetaTags(meta: {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
}): string {
  const { title, description, keywords, ogImage, ogType = 'website' } = meta;
  
  const tags = [
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${title}">`
  ];
  
  if (description) {
    tags.push(
      `<meta property="og:description" content="${description}">`,
      `<meta name="twitter:description" content="${description}">`
    );
  }
  
  if (ogImage) {
    tags.push(`<meta property="og:image" content="${ogImage}">`);
  }
  
  return tags.join('\n    ');
} 