/// <reference lib="deno.unstable" />

import { Article } from "../types/article.ts";

// KVデータベースの接続
export async function getKv() {
  try {
    // 環境変数からデータベースIDを取得
    const databaseId = Deno.env.get("KV_DATABASE_ID");
    
    if (databaseId) {
      // リモートKVに接続
      console.log("リモートKVに接続中...");
      return await Deno.openKv(`https://api.deno.com/databases/${databaseId}/connect`);
    } else {
      // ローカルKVに接続（フォールバック）
      console.log("ローカルKVに接続中...");
      return await Deno.openKv();
    }
  } catch (error) {
    console.error("KV接続エラー:", error);
    // 本番環境ではエラーを再スロー
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`KV接続に失敗しました: ${errorMessage}`);
  }
}

// 記事の保存
export async function saveArticle(article: Article): Promise<void> {
  const kv = await getKv();
  
  // スラッグの重複チェック
  const existingSlug = await kv.get<string>(["articles_by_slug", article.slug]);
  if (existingSlug.value && existingSlug.value !== article.id) {
    throw new Error(`スラッグ "${article.slug}" は既に使用されています`);
  }
  
  // 記事を保存
  await kv.set(["articles", article.id], article);
  
  // スラッグでインデックスを作成
  await kv.set(["articles_by_slug", article.slug], article.id);
  
  // カテゴリでインデックスを作成
  await kv.set(["articles_by_category", article.category, article.id], article);
  
  // タグでインデックスを作成
  for (const tag of article.tags) {
    await kv.set(["articles_by_tag", tag, article.id], article);
  }
}

// 記事の取得
export async function getArticle(id: string): Promise<Article | null> {
  const kv = await getKv();
  const result = await kv.get<Article>(["articles", id]);
  return result.value;
}

// スラッグで記事を取得
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const kv = await getKv();
  const idResult = await kv.get<string>(["articles_by_slug", slug]);
  
  if (!idResult.value) {
    return null;
  }
  
  return await getArticle(idResult.value);
}

// 記事一覧の取得
export async function getArticles(
  page: number = 1,
  limit: number = 10,
  category?: string,
  tag?: string
): Promise<{ articles: Article[]; total: number }> {
  const kv = await getKv();
  const articles: Article[] = [];
  
  let prefix: (string | number)[];
  
  if (category) {
    prefix = ["articles_by_category", category];
  } else if (tag) {
    prefix = ["articles_by_tag", tag];
  } else {
    prefix = ["articles"];
  }
  
  const offset = (page - 1) * limit;
  
  // 記事を取得
  const entries = kv.list<Article>({ prefix }, { limit: limit + offset });
  
  let count = 0;
  for await (const entry of entries) {
    count++;
    if (count > offset) {
      articles.push(entry.value);
    }
  }
  
  // 総数を取得
  const totalEntries = kv.list({ prefix });
  let total = 0;
  for await (const _ of totalEntries) {
    total++;
  }
  
  return { articles, total };
}

// 記事の更新
export async function updateArticle(id: string, updates: Partial<Article>): Promise<void> {
  const kv = await getKv();
  const existingArticle = await getArticle(id);
  
  if (!existingArticle) {
    throw new Error("記事が見つかりません");
  }
  
  const updatedArticle: Article = {
    ...existingArticle,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  await saveArticle(updatedArticle);
}

// 記事の削除
export async function deleteArticle(id: string): Promise<void> {
  const kv = await getKv();
  const article = await getArticle(id);
  
  if (!article) {
    throw new Error("記事が見つかりません");
  }
  
  // メインの記事データを削除
  await kv.delete(["articles", id]);
  
  // スラッグインデックスを削除
  await kv.delete(["articles_by_slug", article.slug]);
  
  // カテゴリインデックスを削除
  await kv.delete(["articles_by_category", article.category, id]);
  
  // タグインデックスを削除
  for (const tag of article.tags) {
    await kv.delete(["articles_by_tag", tag, id]);
  }
}

// ユニークIDの生成
export function generateId(): string {
  return crypto.randomUUID();
} 