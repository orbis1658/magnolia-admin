# デプロイ設定ガイド

## GitHub Actions自動デプロイ

### 必要な環境変数

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定してください：

#### 必須シークレット
- `SERVER_HOST`: レンタルサーバーのホスト名（例: `example.com`）
- `SERVER_USER`: SSH接続用のユーザー名（例: `username`）
- `SERVER_PATH`: デプロイ先のディレクトリパス（例: `/home/username/public_html`）

#### オプションシークレット
- `API_URL`: 記事データ取得用APIのURL（デフォルト: `http://localhost:8000`）

### SSH鍵の設定

1. SSH鍵ペアを生成（まだの場合）：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ```

2. 公開鍵をサーバーに配置：
   ```bash
   ssh-copy-id username@example.com
   ```

3. GitHub ActionsでSSH鍵を使用するため、以下のシークレットも追加：
   - `SSH_PRIVATE_KEY`: 秘密鍵の内容
   - `SSH_KNOWN_HOSTS`: サーバーのknown_hosts

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