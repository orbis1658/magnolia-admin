import { Handlers } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth-helper.ts";

interface BuildRequest {
  force?: boolean; // 強制再ビルド
}

interface BuildResponse {
  success: boolean;
  message: string;
  buildTime?: number;
  generatedPages?: number;
  error?: string;
}

/**
 * 静的サイトビルドを実行
 */
async function executeBuild(): Promise<BuildResponse> {
  const startTime = Date.now();
  
  try {
    const cwd = Deno.cwd() + "/static-site";
    console.log("ビルド実行ディレクトリ:", cwd);
    console.log("現在のディレクトリ:", Deno.cwd());
    
    // 静的サイトビルダーを実行
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read", 
        "--allow-write",
        "build.ts"
      ],
      cwd: cwd,
      stdout: "piped",
      stderr: "piped"
    });

    const { code, stdout, stderr } = await process.output();
    
    const output = new TextDecoder().decode(stdout);
    const errorOutput = new TextDecoder().decode(stderr);
    
    console.log("ビルドプロセス出力:", output);
    console.log("ビルドプロセスエラー:", errorOutput);
    console.log("ビルドプロセス終了コード:", code);
    
    if (code !== 0) {
      console.error("ビルドエラー:", errorOutput);
      return {
        success: false,
        message: "ビルドに失敗しました",
        error: errorOutput,
        buildTime: Date.now() - startTime
      };
    }
    
    // 生成されたページ数をカウント
    const generatedPages = await countGeneratedPages();
    
    return {
      success: true,
      message: "ビルドが完了しました",
      buildTime: Date.now() - startTime,
      generatedPages
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ビルド実行エラー:", errorMessage);
    
    return {
      success: false,
      message: "ビルドの実行に失敗しました",
      error: errorMessage,
      buildTime: Date.now() - startTime
    };
  }
}

/**
 * 生成されたページ数をカウント
 */
async function countGeneratedPages(): Promise<number> {
  try {
    const distDir = "static-site/dist";
    let count = 0;
    
    // index.htmlをカウント
    try {
      await Deno.stat(`${distDir}/index.html`);
      count++;
    } catch {
      // ファイルが存在しない場合はスキップ
    }
    
    // articlesディレクトリのHTMLファイルをカウント
    try {
      const articlesDir = `${distDir}/articles`;
      for await (const entry of Deno.readDir(articlesDir)) {
        if (entry.isFile && entry.name.endsWith('.html')) {
          count++;
        }
      }
    } catch {
      // ディレクトリが存在しない場合はスキップ
    }
    
    return count;
  } catch {
    return 0;
  }
}

export const handler: Handlers = {
  async POST(req) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const body: BuildRequest = await req.json();
          console.log("ビルドリクエスト受信:", body);
    
    // ビルドを実行
    const result = await executeBuild();
    
    console.log("ビルド結果:", result);
    console.log("ビルド出力:", result);
      
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("ビルドAPIエラー:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const errorResponse: BuildResponse = {
        success: false,
        message: "ビルドリクエストの処理に失敗しました",
        error: errorMessage
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // GETリクエストでビルド状況を確認
  async GET(req) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const generatedPages = await countGeneratedPages();
      
      const response = {
        success: true,
        message: "ビルド状況を取得しました",
        generatedPages,
        lastBuildTime: null // TODO: 最終ビルド時刻を記録・取得
      };
      
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("ビルド状況取得エラー:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "ビルド状況の取得に失敗しました",
          error: errorMessage
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}; 