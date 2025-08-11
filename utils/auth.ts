import { getKv } from "./kv.ts";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  created_at: string;
}

export interface Session {
  id: string;
  userId: string;
  username: string; // ユーザー名も保存
  expiresAt: string;
  created_at: string;
}

// 環境変数から管理者の認証情報を取得
function getAdminCredentials() {
  const ADMIN_USERNAME = Deno.env.get("ADMIN_USERNAME");
  const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error("環境変数が設定されていません:");
    console.error("ADMIN_USERNAME:", ADMIN_USERNAME ? "設定済み" : "未設定");
    console.error("ADMIN_PASSWORD:", ADMIN_PASSWORD ? "設定済み" : "未設定");
    throw new Error("管理者認証情報の環境変数が設定されていません。ADMIN_USERNAME と ADMIN_PASSWORD を設定してください。");
  }

  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
}

// セッションの有効期限（24時間）
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// 管理者ユーザーを初期化
export async function initializeAdminUser(): Promise<void> {
  try {
    const credentials = getAdminCredentials();
    const kv = await getKv();
    
    // 管理者ユーザーが存在するかチェック
    const existingUser = await kv.get<User>(["users", credentials.username]);
    
    if (!existingUser.value) {
      // 管理者ユーザーを作成
      const user: User = {
        id: crypto.randomUUID(),
        username: credentials.username,
        passwordHash: await hashPassword(credentials.password),
        created_at: new Date().toISOString(),
      };
      
      await kv.set(["users", credentials.username], user);
      console.log("管理者ユーザーを作成しました");
    }
  } catch (error) {
    console.error("管理者ユーザー初期化エラー:", error);
    throw new Error("管理者ユーザーの初期化に失敗しました");
  }
}

// パスワードをハッシュ化
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// パスワードを検証
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ユーザー認証
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const kv = await getKv();
  const user = await kv.get<User>(["users", username]);
  
  if (!user.value) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.value.passwordHash);
  return isValid ? user.value : null;
}

// セッションを作成
export async function createSession(userId: string, username: string): Promise<Session> {
  const kv = await getKv();
  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    username,
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
    created_at: new Date().toISOString(),
  };
  
  await kv.set(["sessions", session.id], session);
  return session;
}

// セッションを検証
export async function validateSession(sessionId: string): Promise<User | null> {
  const kv = await getKv();
  const session = await kv.get<Session>(["sessions", sessionId]);
  
  if (!session.value) {
    return null;
  }
  
  // セッションの有効期限をチェック
  if (new Date(session.value.expiresAt) < new Date()) {
    // 期限切れのセッションを削除
    await kv.delete(["sessions", sessionId]);
    return null;
  }
  
  // ユーザー名でユーザーを検索
  const user = await kv.get<User>(["users", session.value.username]);
  
  if (!user.value) {
    // ユーザーが見つからない場合はセッションを削除
    await kv.delete(["sessions", sessionId]);
    return null;
  }
  
  return user.value;
}

// セッションを削除（ログアウト）
export async function deleteSession(sessionId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["sessions", sessionId]);
}

// 期限切れのセッションをクリーンアップ
export async function cleanupExpiredSessions(): Promise<void> {
  const kv = await getKv();
  const sessions = kv.list({ prefix: ["sessions"] });
  
  for await (const session of sessions) {
    const sessionData = session.value as Session;
    if (new Date(sessionData.expiresAt) < new Date()) {
      await kv.delete(session.key);
    }
  }
} 