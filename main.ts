/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { load } from "$std/dotenv/mod.ts";

// .envファイルを明示的に読み込み（開発環境のみ）
if (Deno.env.get("DENO_DEPLOYMENT_ID") === undefined) {
  await load({ export: true });
}

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { cleanupExpiredSessions } from "./utils/auth.ts";

// 環境変数の確認（デプロイ時のみ）
if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
  console.log("Deno Deploy環境で起動中...");
  console.log("ADMIN_USERNAME:", Deno.env.get("ADMIN_USERNAME") ? "設定済み" : "未設定");
  console.log("ADMIN_PASSWORD:", Deno.env.get("ADMIN_PASSWORD") ? "設定済み" : "未設定");
  console.log("KV_DATABASE_ID:", Deno.env.get("KV_DATABASE_ID") ? "設定済み" : "未設定");
}

// 定期的に期限切れセッションをクリーンアップ
setInterval(async () => {
  try {
    await cleanupExpiredSessions();
  } catch (error) {
    console.error("セッションクリーンアップエラー:", error);
  }
}, 60 * 60 * 1000); // 1時間ごと

await start(manifest, config);
