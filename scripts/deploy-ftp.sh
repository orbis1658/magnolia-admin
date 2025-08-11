#!/bin/bash

# 静的サイトFTPデプロイスクリプト
# さくらのレンタルサーバー用

set -e

# 設定
FTP_HOST="${FTP_HOST}"
FTP_USER="${FTP_USER}"
FTP_PASS="${FTP_PASS}"
FTP_PATH="${FTP_PATH:-/}"

# 必須環境変数のチェック
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
    echo "エラー: 必要な環境変数が設定されていません"
    echo "FTP_HOST: $FTP_HOST"
    echo "FTP_USER: $FTP_USER"
    echo "FTP_PASS: [設定済み]"
    exit 1
fi

echo "🚀 静的サイトをFTPでデプロイします..."
echo "ホスト: $FTP_HOST"
echo "ユーザー: $FTP_USER"
echo "パス: $FTP_PATH"

# ビルドディレクトリの存在確認
if [ ! -d "static-site/dist" ]; then
    echo "エラー: static-site/dist ディレクトリが見つかりません"
    echo "先にビルドを実行してください"
    exit 1
fi

# lftpを使用したFTPアップロード
echo "📤 ファイルをFTPでアップロード中..."

# lftpコマンドの作成
cat > /tmp/lftp_script << EOF
open -u $FTP_USER,$FTP_PASS $FTP_HOST
cd $FTP_PATH
mirror --reverse --delete --verbose static-site/dist/ .
bye
EOF

# lftpでアップロード実行
lftp -f /tmp/lftp_script

echo "✅ FTPデプロイが完了しました！"
echo "🌐 サイトURL: https://$FTP_HOST"

# 一時ファイルの削除
rm -f /tmp/lftp_script 