# GitHub Actions + FTPアップロード設定ガイド

## 概要

このガイドでは、管理画面の「静的サイトをビルド」ボタンからGitHub Actionsをトリガーし、さくらのレンタルサーバーにFTPアップロードする設定方法を説明します。

## 前提条件

- GitHubリポジトリが設定済み
- さくらのレンタルサーバーのFTP情報を取得済み
- Deno Deployで管理画面がデプロイ済み

## セットアップ手順

### 1. GitHub Personal Access Tokenの作成

1. GitHubにログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token" → "Generate new token (classic)"
4. 以下の権限を付与：
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. トークンを生成し、安全な場所に保存

### 2. GitHub Secretsの設定

リポジトリのSettings → Secrets and variables → Actionsで以下のシークレットを設定：

#### 必須シークレット
- `PERSONAL_ACCESS_TOKEN`: 上記で作成したPersonal Access Token
- `REPO_OWNER`: GitHubユーザー名または組織名
- `REPO_NAME`: リポジトリ名
- `ADMIN_API_URL`: 管理画面のURL（例：`https://magnolia-admin.deno.dev`）

#### FTP設定（さくらのレンタルサーバー）
- `FTP_SERVER`: FTPサーバーのホスト名（例：`your-domain.com`）
- `FTP_USERNAME`: FTPユーザー名
- `FTP_PASSWORD`: FTPパスワード
- `FTP_SERVER_DIR`: アップロード先ディレクトリ（例：`/public_html/`）

### 3. 環境変数の設定

Deno Deployの管理画面で以下の環境変数を設定：

```bash
PERSONAL_ACCESS_TOKEN=your_github_personal_access_token_here
REPO_OWNER=your_github_username
REPO_NAME=your_repository_name
ADMIN_API_URL=https://magnolia-admin.deno.dev
```

### 4. ワークフローファイルの確認

`.github/workflows/deploy.yml`が正しく設定されていることを確認：

- `workflow_dispatch`トリガーが設定済み
- `build-and-deploy-static`ジョブが含まれている
- FTP Deploy Actionが設定済み

## 使用方法

### 管理画面からの実行

1. 管理画面にログイン
2. 記事一覧ページで「静的サイトをビルド」ボタンをクリック
3. 確認ダイアログで「OK」を選択（GitHub Actions実行）
4. または「キャンセル」を選択（ローカルビルドのみ）

### GitHub Actionsの監視

1. GitHubリポジトリのActionsタブを開く
2. `Build and Deploy Static Site`ワークフローを確認
3. 実行状況とログを監視

## トラブルシューティング

### よくある問題

#### 1. GitHub API認証エラー
- `PERSONAL_ACCESS_TOKEN`が正しく設定されているか確認
- トークンに適切な権限が付与されているか確認

#### 2. FTP接続エラー
- FTPサーバー情報が正しいか確認
- ファイアウォールやセキュリティ設定を確認

#### 3. ビルドエラー
- `ADMIN_API_URL`が正しく設定されているか確認
- 管理画面が正常に動作しているか確認

### ログの確認方法

1. GitHub Actionsの実行ログを確認
2. Deno Deployのログを確認
3. 管理画面のコンソールログを確認

## セキュリティ注意事項

- GitHub Personal Access Tokenは定期的に更新する
- FTPパスワードは強力なものを使用する
- 環境変数は適切に管理する
- 不要な権限は付与しない

## カスタマイズ

### FTPアップロード先の変更

`FTP_SERVER_DIR`シークレットを変更することで、アップロード先ディレクトリを変更できます。

### ビルドプロセスのカスタマイズ

`static-site/build.ts`を編集することで、ビルドプロセスをカスタマイズできます。

### ワークフローのカスタマイズ

`.github/workflows/deploy.yml`を編集することで、ワークフローをカスタマイズできます。 