import { Handlers } from "$fresh/server.ts";
import { ArticleListResponse, Article } from "../../../types/article.ts";
import { getArticles } from "../../../utils/kv.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "100"); // デフォルトで100件取得
      const category = url.searchParams.get("category") || undefined;
      const tag = url.searchParams.get("tag") || undefined;

      // KVから記事を取得
      const result = await getArticles(page, limit, category, tag);
      
      const response: ArticleListResponse = {
        articles: result.articles,
        total: result.total,
        page,
        limit,
      };

      return new Response(JSON.stringify(response), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type"
        },
      });
    } catch (error) {
      console.error("公開記事取得エラー:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("エラー詳細:", errorMessage);
      return new Response(
        JSON.stringify({ 
          error: "記事の取得に失敗しました",
          details: errorMessage
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }
  },

  // OPTIONS リクエストに対応（CORS用）
  async OPTIONS(req) {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
}; 