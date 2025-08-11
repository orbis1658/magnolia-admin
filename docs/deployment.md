# デプロイ設定ガイド

## GitHub Actions自動デプロイ

### 必要な環境変数

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定してください：

#### 必須シークレット（FTP用）
- `FTP_HOST`: FTPサーバーのホスト名（例: `example.com`）
- `FTP_USER`: FTP接続用のユーザー名（例: `username`）
- `FTP_PASS`: FTP接続用のパスワード

#### オプションシークレット
- `FTP_PATH`: デプロイ先のディレクトリパス（デフォルト: `/`）
- `API_URL`: 記事データ取得用APIのURL（デフォルト: `http://localhost:8000`）

### FTP設定

さくらのレンタルサーバーではFTP/SFTPを使用してデプロイします。

1. FTP接続情報を確認：
   - FTPサーバーアドレス
   - FTPユーザー名
   - FTPパスワード
   - デプロイ先ディレクトリ

2. さくらのレンタルサーバーの管理画面で：
   - FTPアカウントの確認
   - パスワードの確認
   - 接続可能なディレクトリの確認

### デプロイの流れ

1. **mainブランチへのプッシュ** → 自動的にデプロイが開始
2. **手動実行** → GitHub Actionsの「Run workflow」から手動実行可能

### デプロイスクリプト

`scripts/deploy.sh`を使用してローカルからもデプロイ可能：

```bash
# 環境変数を設定
export SERVER_HOST="example.com"
export SERVER_USER="username"
export SERVER_PATH="/home/username/public_html"

# デプロイ実行
./scripts/deploy.sh
```

### トラブルシューティング

#### よくある問題

1. **SSH接続エラー**
   - SSH鍵の設定を確認
   - サーバーのSSH設定を確認

2. **権限エラー**
   - サーバーのディレクトリ権限を確認
   - ユーザーの書き込み権限を確認

3. **ビルドエラー**
   - API_URLの設定を確認
   - 記事データが正常に取得できるか確認

#### ログの確認

GitHub Actionsのログで詳細なエラー情報を確認できます：
1. GitHubリポジトリの「Actions」タブ
2. 該当するワークフローを選択
3. 失敗したジョブのログを確認 