import { h } from "preact";
import { BaseLayout } from "../../layouts/base.tsx";
import { Article } from "../../../build/builder.ts";
import { tagToSlug } from "../../../build/utils.ts";

interface TagInfo {
  name: string;
  count: number;
  latestArticle?: Article;
}

interface TagIndexPageData {
  tags: TagInfo[];
}

export function TagIndexPage({ tags }: TagIndexPageData) {
  const title = "タグ一覧 | magnolia";
  const description = "magnoliaの記事タグ一覧です。";

  return (
    <BaseLayout title={title} description={description}>
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            タグ一覧
          </h1>
          <p class="text-gray-600">
            {tags.length}個のタグ
          </p>
        </div>
        
        {tags.length === 0 ? (
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">
              タグがありません。
            </p>
            <a 
              href="/magnolia/" 
              class="text-blue-600 hover:text-blue-800 mt-4 inline-block"
            >
              ホームに戻る
            </a>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map(tag => (
              <div key={tag.name} class="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <h2 class="text-xl font-semibold mb-2">
                  <a 
                    href={`/magnolia/tags/${tagToSlug(tag.name)}.html`}
                    class="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    #{tag.name}
                  </a>
                </h2>
                
                <p class="text-gray-600 mb-4">
                  {tag.count}件の記事
                </p>
                
                {tag.latestArticle && (
                  <div class="text-sm text-gray-500">
                    <p>最新記事:</p>
                    <a 
                      href={`/magnolia/articles/${tag.latestArticle.slug}.html`}
                      class="text-blue-600 hover:text-blue-800"
                    >
                      {tag.latestArticle.title}
                    </a>
                    <p class="mt-1">
                      {new Date(tag.latestArticle.pub_date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  );
} 