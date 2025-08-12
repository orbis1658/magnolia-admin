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
      
      <p class="text-gray-700 leading-relaxed">
        {article.body.length > 200 
          ? `${article.body.substring(0, 200)}...` 
          : article.body
        }
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