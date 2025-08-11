#!/bin/bash

# 静的サイトデプロイスクリプト
# 使用方法: ./scripts/deploy.sh [server_name]

set -e

# 設定
DEFAULT_SERVER="production"
SERVER_NAME=${1:-$DEFAULT_SERVER}

# サーバー設定（環境変数から取得）
SERVER_HOST="${SERVER_HOST}"
SERVER_USER="${SERVER_USER}"
SERVER_PATH="${SERVER_PATH}"

# 必須環境変数のチェック
if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_PATH" ]; then
    echo "エラー: 必要な環境変数が設定されていません"
    echo "SERVER_HOST: $SERVER_HOST"
    echo "SERVER_USER: $SERVER_USER"
    echo "SERVER_PATH: $SERVER_PATH"
    exit 1
fi

echo "🚀 静的サイトをデプロイします..."
echo "サーバー: $SERVER_HOST"
echo "ユーザー: $SERVER_USER"
echo "パス: $SERVER_PATH"

# ビルドディレクトリの存在確認
if [ ! -d "static-site/dist" ]; then
    echo "エラー: static-site/dist ディレクトリが見つかりません"
    echo "先にビルドを実行してください"
    exit 1
fi

# rsyncでファイルをアップロード
echo "📤 ファイルをアップロード中..."
rsync -avz --delete \
    --exclude='.git*' \
    --exclude='*.log' \
    --exclude='node_modules' \
    static-site/dist/ \
    "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

echo "✅ デプロイが完了しました！"
echo "🌐 サイトURL: https://${SERVER_HOST}"

# デプロイ後の確認
echo "🔍 デプロイ結果を確認中..."
ssh "${SERVER_USER}@${SERVER_HOST}" "ls -la ${SERVER_PATH}/" 