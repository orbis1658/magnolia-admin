import { Handlers } from "$fresh/server.ts";
import { Article } from "../../../types/article.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { id } = ctx.params;

      // TODO: Deno KVから記事を取得する実装
      // 現在はダミーデータを返す
      const article: Article | null = null;

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
    try {
      const { id } = ctx.params;
      const body = await req.json();

      // TODO: バリデーション実装
      // TODO: Deno KVで記事を更新する実装

      return new Response(
        JSON.stringify({ message: "記事が更新されました" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
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
    try {
      const { id } = ctx.params;

      // TODO: Deno KVから記事を削除する実装

      return new Response(
        JSON.stringify({ message: "記事が削除されました" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
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