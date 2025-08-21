import { h } from "preact";
import { Article } from "../../build/builder.ts";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // HTMLタグを除去し、<br>タグを改行に変換する関数
  const stripHtmlAndConvertBreaks = (html: string): string => {
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
  };

  // 記事本文をプレーンテキストに変換
  const plainTextBody = stripHtmlAndConvertBreaks(article.body);
  const displayText = plainTextBody.length > 200 
    ? `${plainTextBody.substring(0, 200)}...` 
    : plainTextBody;

  return (
    <article class="border rounded-lg p-6 hover:shadow-md transition-shadow">
      <h2 class="text-2xl font-semibold mb-2">
        <a 
          href={`/magnolia/articles/${article.slug}.html`} 
          class="text-blue-600 hover:text-blue-800 transition-colors"
        >
          {article.title}
        </a>
      </h2>
      
      <div class="text-gray-600 mb-4 flex flex-wrap items-center gap-2">
        <span class="text-sm">
          📅 {formatDate(article.pub_date)}
        </span>
        <span class="text-sm">
          📂 {article.category}
        </span>
      </div>
      
      {article.tags.length > 0 && (
        <div class="mb-4 flex flex-wrap gap-2">
          {article.tags.map(tag => (
            <span class="bg-gray-200 px-2 py-1 rounded text-sm text-gray-700">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <p class="text-gray-700 leading-relaxed whitespace-pre-line">
        {displayText}
      </p>
      
      <div class="mt-4">
        <a 
          href={`/magnolia/articles/${article.slug}.html`}
          class="text-blue-600 hover:text-blue-800 font-medium"
        >
          続きを読む →
        </a>
      </div>
    </article>
  );
} 