import { validateSession } from "./auth.ts";

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

// 認証チェック
export async function checkAuth(req: Request): Promise<{ user: any; sessionId: string } | null> {
  const cookie = req.headers.get("cookie") || "";
  const sessionId = getSessionIdFromCookie(cookie);
  
  if (!sessionId) {
    return null;
  }
  
  const user = await validateSession(sessionId);
  return user ? { user, sessionId } : null;
}

// 認証が必要なページで使用するヘルパー
export async function requireAuth(req: Request): Promise<Response | { user: any; sessionId: string }> {
  const auth = await checkAuth(req);
  
  if (!auth) {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/login",
      },
    });
  }
  
  return auth;
} 