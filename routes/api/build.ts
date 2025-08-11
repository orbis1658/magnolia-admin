import { Handlers } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth-helper.ts";

interface BuildRequest {
  force?: boolean; // 強制再ビルド
  trigger_github_actions?: boolean; // GitHub Actionsをトリガーするかどうか
}

interface BuildResponse {
  success: boolean;
  message: string;
  buildTime?: number;
  generatedPages?: number;
  error?: string;
  workflowRunId?: string; // GitHub Actionsのワークフロー実行ID
}

interface GitHubWorkflowResponse {
  id: number;
  status: string;
  conclusion?: string;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub Actionsワークフローをトリガー
 */
async function triggerGitHubWorkflow(): Promise<{ success: boolean; runId?: number; error?: string }> {
  try {
    const githubToken = Deno.env.get('PERSONAL_ACCESS_TOKEN');
    const repoOwner = Deno.env.get('REPO_OWNER');
    const repoName = Deno.env.get('REPO_NAME');
    
    if (!githubToken || !repoOwner || !repoName) {
      return {
        success: false,
        error: 'GitHub設定が不完全です。PERSONAL_ACCESS_TOKEN、REPO_OWNER、REPO_NAMEを設定してください。'
      };
    }
    
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/deploy.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            build_static_site: 'true'
          }
        })
      }
    );
    
    if (response.status === 204) {
      // ワークフローが正常にトリガーされた
      // 最新のワークフロー実行IDを取得
      const runsResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/deploy.yml/runs?per_page=1`,
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );
      
      if (runsResponse.ok) {
        const runsData = await runsResponse.json();
        if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
          return {
            success: true,
            runId: runsData.workflow_runs[0].id
          };
        }
      }
      
      return { success: true };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `GitHub API エラー: ${response.status} - ${errorText}`
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `GitHubワークフロートリガーエラー: ${errorMessage}`
    };
  }
}

/**
 * GitHub Actionsワークフローの状況を確認
 */
async function checkGitHubWorkflowStatus(runId: number): Promise<{ status: string; conclusion?: string; error?: string }> {
  try {
    const githubToken = Deno.env.get('PERSONAL_ACCESS_TOKEN');
    const repoOwner = Deno.env.get('REPO_OWNER');
    const repoName = Deno.env.get('REPO_NAME');
    
    if (!githubToken || !repoOwner || !repoName) {
      return { status: 'unknown', error: 'GitHub設定が不完全です' };
    }
    
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${runId}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );
    
    if (response.ok) {
      const data: GitHubWorkflowResponse = await response.json();
      return {
        status: data.status,
        conclusion: data.conclusion
      };
    } else {
      return { status: 'unknown', error: `GitHub API エラー: ${response.status}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: 'unknown', error: `ワークフロー状況確認エラー: ${errorMessage}` };
  }
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
    
      // GitHub Actionsをトリガーするかどうかチェック
      if (body.trigger_github_actions) {
        console.log("GitHub Actionsワークフローをトリガー中...");
        const workflowResult = await triggerGitHubWorkflow();
        
        if (workflowResult.success) {
          const result: BuildResponse = {
            success: true,
            message: "GitHub Actionsワークフローが正常にトリガーされました",
            workflowRunId: workflowResult.runId?.toString()
          };
          
          console.log("GitHub Actionsトリガー結果:", result);
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          const errorResponse: BuildResponse = {
            success: false,
            message: "GitHub Actionsワークフローのトリガーに失敗しました",
            error: workflowResult.error
          };
          
          return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    
      // ローカルビルドを実行
      const result = await executeBuild();
      
      console.log("ビルド結果:", result);
      
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
      const url = new URL(req.url);
      const runId = url.searchParams.get('runId');
      
      // ワークフロー実行IDが指定されている場合はGitHub Actionsの状況を確認
      if (runId) {
        const runIdNum = parseInt(runId);
        if (isNaN(runIdNum)) {
          return new Response(
            JSON.stringify({ 
              success: false,
              message: "無効なワークフロー実行IDです",
              error: "Invalid run ID"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        
        const workflowStatus = await checkGitHubWorkflowStatus(runIdNum);
        
        const response = {
          success: true,
          message: "GitHub Actionsワークフロー状況を取得しました",
          workflowStatus: workflowStatus.status,
          workflowConclusion: workflowStatus.conclusion,
          workflowError: workflowStatus.error
        };
        
        return new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // 通常のビルド状況を取得
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