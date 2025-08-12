import { join, dirname, extname } from "https://deno.land/std@0.208.0/path/mod.ts";

/**
 * ファイルが存在するかチェック
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * ディレクトリが存在するかチェック
 */
export async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

/**
 * ディレクトリを作成（親ディレクトリも含めて）
 */
export async function ensureDir(path: string): Promise<void> {
  if (!(await dirExists(path))) {
    await Deno.mkdir(path, { recursive: true });
  }
}

/**
 * ファイルをコピー
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(dirname(dest));
  await Deno.copyFile(src, dest);
}

/**
 * ディレクトリを再帰的にコピー
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  
  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * ファイル拡張子を取得
 */
export function getFileExtension(path: string): string {
  return extname(path).toLowerCase();
}

/**
 * ファイル拡張子を変更
 */
export function changeExtension(path: string, newExt: string): string {
  const ext = extname(path);
  return path.slice(0, -ext.length) + newExt;
}

/**
 * スラッグをファイル名に変換
 */
export function slugToFilename(slug: string): string {
  return slug.replace(/[^a-z0-9-]/g, '-') + '.html';
}

/**
 * カテゴリ名をURLフレンドリーな文字列に変換
 * 日本語のままファイル名として使用
 */
export function categoryToSlug(category: string): string {
  // 基本的なクリーンアップ
  let result = category.trim();
  
  // 空文字列の場合はデフォルト値を返す
  if (!result) {
    return 'category';
  }
  
  // 日本語のまま返す（URLエンコーディングしない）
  // 例: "植物" → "植物"
  return result;
}

/**
 * カテゴリ名をファイル名に変換
 */
export function categoryToFilename(category: string): string {
  return categoryToSlug(category) + '.html';
}

/**
 * タグ名をURLフレンドリーな文字列に変換
 * 日本語のままファイル名として使用
 */
export function tagToSlug(tag: string): string {
  // 基本的なクリーンアップ
  let result = tag.trim();
  
  // 空文字列の場合はデフォルト値を返す
  if (!result) {
    return 'tag';
  }
  
  // 日本語のまま返す（URLエンコーディングしない）
  // 例: "樹木医" → "樹木医"
  return result;
}

/**
 * タグ名をファイル名に変換
 */
export function tagToFilename(tag: string): string {
  return tagToSlug(tag) + '.html';
}

/**
 * 日付をフォーマット
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * ログ出力
 */
export function log(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌'
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
} 