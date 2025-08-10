export interface Article {
  id: string;
  slug: string;
  title: string;
  pub_date: string; // ISO 8601形式 (YYYY-MM-DDTHH:mm:ss.sssZ)
  category: string;
  tags: string[];
  body: string;
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
}

export interface CreateArticleRequest {
  slug: string;
  title: string;
  pub_date?: string; // 未指定の場合は現在時刻
  category: string;
  tags: string[];
  body: string;
}

export interface UpdateArticleRequest {
  slug?: string;
  title?: string;
  pub_date?: string;
  category?: string;
  tags?: string[];
  body?: string;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
} 