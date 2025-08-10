import { Handlers } from "$fresh/server.ts";
import { ArticleListResponse, CreateArticleRequest, Article } from "../../../types/article.ts";
import { getArticles, saveArticle, generateId } from "../../../utils/kv.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
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
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("記事取得エラー:", error);
      return new Response(
        JSON.stringify({ 
          error: "記事の取得に失敗しました",
          details: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async POST(req) {
    try {
      console.log("=== API記事作成開始 ===");
      const body: CreateArticleRequest = await req.json();
      console.log("受信したデータ:", body);
      
      // バリデーション
      if (!body.title || !body.slug || !body.body) {
        console.log("APIバリデーションエラー: 必須項目が不足");
        return new Response(
          JSON.stringify({ error: "タイトル、スラッグ、本文は必須です" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // 記事オブジェクトを作成
      const now = new Date().toISOString();
      const article: Article = {
        id: generateId(),
        slug: body.slug,
        title: body.title,
        pub_date: body.pub_date || now,
        category: body.category || "未分類",
        tags: body.tags || [],
        body: body.body,
        created_at: now,
        updated_at: now,
      };

      console.log("記事オブジェクト作成:", article);
      
      // KVに保存
      console.log("KV保存開始");
      await saveArticle(article);
      console.log("KV保存完了");

      const responseData = { 
        message: "記事が作成されました",
        article: article
      };
      console.log("成功レスポンス送信:", responseData);
      
      return new Response(
        JSON.stringify(responseData),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("記事作成エラー:", error);
      
      // スラッグ重複エラーの場合
      if (error instanceof Error && error.message.includes("スラッグ")) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "記事の作成に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
}; 