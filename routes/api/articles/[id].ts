import { Handlers } from "$fresh/server.ts";
import { Article, UpdateArticleRequest } from "../../../types/article.ts";
import { getArticle, updateArticle, deleteArticle } from "../../../utils/kv.ts";
import { requireAuth } from "../../../utils/auth-helper.ts";

/**
 * 静的ファイルを削除
 */
async function deleteStaticFiles(slug: string): Promise<void> {
  try {
    const filename = slugToFilename(slug);
    const filepath = `static-site/dist/articles/${filename}`;
    
    // ファイルが存在するかチェック
    try {
      await Deno.stat(filepath);
    } catch {
      // ファイルが存在しない場合は何もしない
      console.log(`静的ファイルが見つかりません: ${filepath}`);
      return;
    }
    
    // ファイルを削除
    await Deno.remove(filepath);
    console.log(`静的ファイルを削除しました: ${filepath}`);
  } catch (error) {
    console.error(`静的ファイル削除エラー: ${error}`);
    // エラーが発生しても処理を続行
  }
}

/**
 * スラッグをファイル名に変換
 */
function slugToFilename(slug: string): string {
  return `${slug}.html`;
}

/**
 * GitHub Actionsワークフローをトリガー
 */
async function triggerGitHubWorkflow(): Promise<{ success: boolean; error?: string }> {
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

export const handler: Handlers = {
  async GET(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;

      // KVから記事を取得
      const article = await getArticle(id);

      if (!article) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify(article), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("記事取得エラー:", error);
      return new Response(
        JSON.stringify({ error: "記事の取得に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async PUT(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;
      const body: UpdateArticleRequest = await req.json();

      // バリデーション
      if (Object.keys(body).length === 0) {
        return new Response(
          JSON.stringify({ error: "更新するデータが指定されていません" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // KVで記事を更新
      await updateArticle(id, body);

      return new Response(
        JSON.stringify({ message: "記事が更新されました" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("記事更新エラー:", error);
      
      if (error instanceof Error && error.message.includes("記事が見つかりません")) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "記事の更新に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async DELETE(req, ctx) {
    // 認証チェック
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    try {
      const { id } = ctx.params;

      // 削除前に記事情報を取得（スラッグが必要）
      const article = await getArticle(id);
      if (!article) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // KVから記事を削除
      await deleteArticle(id);

      // 静的ファイルを削除
      console.log(`記事削除: 静的ファイルを削除中... (slug: ${article.slug})`);
      await deleteStaticFiles(article.slug);

      // GitHub Actionsをトリガーしてレンタルサーバーからも削除
      console.log("記事削除: GitHub Actionsをトリガー中...");
      const workflowResult = await triggerGitHubWorkflow();
      
      if (workflowResult.success) {
        console.log("記事削除: GitHub Actionsトリガー成功");
        return new Response(
          JSON.stringify({ 
            message: "記事が削除されました。静的サイトも更新されます。",
            workflowTriggered: true
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        console.warn(`記事削除: GitHub Actionsトリガー失敗 - ${workflowResult.error}`);
        // GitHub Actionsの失敗は警告として扱い、記事削除は成功とする
        return new Response(
          JSON.stringify({ 
            message: "記事が削除されました。静的サイトの更新に失敗しました。",
            workflowTriggered: false,
            workflowError: workflowResult.error
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("記事削除エラー:", error);
      
      if (error instanceof Error && error.message.includes("記事が見つかりません")) {
        return new Response(
          JSON.stringify({ error: "記事が見つかりません" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "記事の削除に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
}; 