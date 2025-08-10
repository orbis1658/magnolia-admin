import { Handlers } from "$fresh/server.ts";
import { validateSession } from "./auth.ts";

// 認証が必要なルートのパターン
const PROTECTED_ROUTES = [
  "/articles",
  "/api/articles",
  "/api-test",
];

// 認証が不要なルートのパターン
const PUBLIC_ROUTES = [
  "/login",
  "/",
];

// ルートが保護されているかチェック
function isProtectedRoute(pathname: string): boolean {
  // 公開ルートは除外
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return false;
  }
  
  // 保護されたルートかチェック
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// セッションIDをCookieから取得
function getSessionIdFromCookie(cookie: string): string | null {
  const cookies = cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies["session_id"] || null;
}

// 認証ミドルウェア
export async function authMiddleware(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // 保護されたルートでない場合は認証不要
  if (!isProtectedRoute(pathname)) {
    return null;
  }
  
  // CookieからセッションIDを取得
  const cookie = req.headers.get("cookie") || "";
  const sessionId = getSessionIdFromCookie(cookie);
  
  if (!sessionId) {
    // セッションIDがない場合はログインページにリダイレクト
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/login",
      },
    });
  }
  
  // セッションを検証
  const user = await validateSession(sessionId);
  
  if (!user) {
    // 無効なセッションの場合はログインページにリダイレクト
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/login",
      },
    });
  }
  
  // 認証成功
  return null;
}

// セッションIDをCookieに設定するヘルパー関数
export function setSessionCookie(sessionId: string): string {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

// セッションIDをCookieから削除するヘルパー関数
export function clearSessionCookie(): string {
  return "session_id=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
} 