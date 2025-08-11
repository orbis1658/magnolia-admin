import { build } from "./build/builder.ts";

/**
 * メインエントリーポイント
 */
async function main() {
  try {
    console.log('🚀 Magnolia 静的サイトビルダーを開始します...');
    
    await build();
    
    console.log('🎉 ビルドが正常に完了しました！');
    console.log('📁 生成されたファイル: dist/ ディレクトリ');
    
  } catch (error) {
    console.error('❌ ビルドエラー:', error);
    Deno.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain()を呼び出し
if (import.meta.main) {
  main();
} 