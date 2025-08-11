interface Article {
  id: string;
  slug: string;
  title: string;
  pub_date: string;
  category: string;
  tags: string[];
  body: string;
  created_at: string;
  updated_at: string;
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const excerpt = (text: string, length: number = 150) => {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  };

  return (
    <article className="article-card">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className="category">
            {article.category}
          </span>
          <time className="text-sm text-gray-500">
            {formatDate(article.pub_date)}
          </time>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          <a 
            href={`/articles/${article.slug}`}
            className="hover:text-primary-600 transition-colors duration-200"
          >
            {article.title}
          </a>
        </h2>
        
        <p className="text-gray-600 text-ellipsis-3 mb-4">
          {excerpt(article.body)}
        </p>
        
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <a
                key={tag}
                href={`/tags/${tag}`}
                className="tag"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
} 