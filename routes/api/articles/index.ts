import { Handlers } from "$fresh/server.ts";
import { ArticleListResponse } from "../../../types/article.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const category = url.searchParams.get("category");
      const tag = url.searchParams.get("tag");

      // TODO: Deno KVから記事を取得する実装
      // 現在はダミーデータを返す
      const articles: ArticleListResponse = {
        articles: [],
        total: 0,
        page,
        limit,
      };

      return new Response(JSON.stringify(articles), {
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

  async POST(req) {
    try {
      const body = await req.json();
      
      // TODO: バリデーション実装
      // TODO: Deno KVに記事を保存する実装

      return new Response(
        JSON.stringify({ message: "記事が作成されました" }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
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