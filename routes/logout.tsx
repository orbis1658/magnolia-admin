import { Handlers } from "$fresh/server.ts";
import { deleteSession } from "../utils/auth.ts";
import { clearSessionCookie } from "../utils/middleware.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // CookieからセッションIDを取得
      const cookie = req.headers.get("cookie") || "";
      const sessionId = cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>)["session_id"];

      // セッションを削除
      if (sessionId) {
        await deleteSession(sessionId);
      }

      // ログインページにリダイレクト
      const response = new Response(null, {
        status: 302,
        headers: {
          "Location": "/login",
        },
      });

      // セッションCookieを削除
      response.headers.set("Set-Cookie", clearSessionCookie());

      return response;
    } catch (error) {
      console.error("ログアウトエラー:", error);
      
      // エラーが発生してもログインページにリダイレクト
      const response = new Response(null, {
        status: 302,
        headers: {
          "Location": "/login",
        },
      });

      response.headers.set("Set-Cookie", clearSessionCookie());
      return response;
    }
  },
}; 