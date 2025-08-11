import { Handlers } from '$fresh/server.ts';

export const handler: Handlers = {
  async POST(req) {
    try {
      // ビルドプロセスを実行
      const buildCommand = new Deno.Command('deno', {
        args: ['run', '-A', 'lume.ts'],
        cwd: './static-site',
        stdout: 'piped',
        stderr: 'piped',
      });

      const { code, stdout, stderr } = await buildCommand.output();
      const output = new TextDecoder().decode(stdout);
      const errorOutput = new TextDecoder().decode(stderr);

      if (code === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: '静的サイトのビルドが完了しました',
          output: output,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: 'ビルドに失敗しました',
          error: errorOutput,
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'ビルドプロセスの実行に失敗しました',
        error: error instanceof Error ? error.message : String(error),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
}; 