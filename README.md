# magnolia記事管理画面

## 概要
このディレクトリは、ブログサービス「magnolia」の記事を管理するためのプロジェクトです。

### 記事管理API
 - Deno FreshとDeno KVを使ってブログ記事のCURD処理を行うAPIである

### 記事管理画面
 - APIを通して記事を追加・更新・削除するための画面（フロントエンド）です

## 作業チェックリスト

### ✅ 完了済み
- [x] Deno Freshプロジェクトの初期化
- [x] Tailwind CSSの設定
- [x] 基本的なプロジェクト構造の作成

### 🔄 進行中
- [ ] 

### ✅ 完了済み
- [x] Deno Freshプロジェクトの初期化
- [x] Tailwind CSSの設定
- [x] 基本的なプロジェクト構造の作成
- [x] 記事管理APIの設計

### 🔄 進行中
- [ ] Deno KVの設定

### 📋 未着手
- [ ] 記事のCRUD操作APIの実装
- [ ] 記事一覧画面の作成
- [ ] 記事作成・編集画面の作成
- [ ] 記事削除機能の実装
- [ ] 認証機能の実装
- [ ] エラーハンドリングの実装
- [ ] レスポンシブデザインの対応
- [ ] テストの作成
- [ ] デプロイ設定

## 開発環境の起動

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```bash
deno task start
```

This will watch the project directory and restart as necessary.
