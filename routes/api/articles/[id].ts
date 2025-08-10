import { Handlers } from "$fresh/server.ts";
import { Article, UpdateArticleRequest } from "../../../types/article.ts";
import { getArticle, updateArticle, deleteArticle } from "../../../utils/kv.ts";
import { requireAuth } from "../../../utils/auth-helper.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;

      // KVから記事を取得
      const article = await getArticle(id);

      if (!article) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify(article), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("記事取得エラー:", error);
      return new Response(
        JSON.stringify({ error: "記事の取得に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async PUT(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;
      const body: UpdateArticleRequest = await req.json();

      // バリデーション
      if (Object.keys(body).length === 0) {
        return new Response(
          JSON.stringify({ error: "更新するデータが指定されていません" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // KVで記事を更新
      await updateArticle(id, body);

      return new Response(
        JSON.stringify({ message: "記事が更新されました" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("記事更新エラー:", error);
      
      if (error instanceof Error && error.message.includes("記事が見つかりません")) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "記事の更新に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async DELETE(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;

      // KVから記事を削除
      await deleteArticle(id);

      return new Response(
        JSON.stringify({ message: "記事が削除されました" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("記事削除エラー:", error);
      
      if (error instanceof Error && error.message.includes("記事が見つかりません")) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "記事の削除に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
}; 