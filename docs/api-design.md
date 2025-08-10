# 記事管理API 設計書

## 概要
magnolia記事管理画面のためのRESTful APIです。Deno FreshとDeno KVを使用して記事のCRUD操作を提供します。

## データ構造

### Article
```typescript
interface Article {
  id: string;           // 記事の一意識別子
  slug: string;         // URL用のスラッグ
  title: string;        // 記事タイトル
  pub_date: string;     // 公開日 (ISO 8601形式)
  category: string;     // カテゴリ
  tags: string[];       // タグ（複数）
  body: string;         // 本文
  created_at: string;   // 作成日時
  updated_at: string;   // 更新日時
}
```

## API エンドポイント

### 1. 記事一覧取得
- **GET** `/api/articles`
- **クエリパラメータ:**
  - `page`: ページ番号 (デフォルト: 1)
  - `limit`: 1ページあたりの件数 (デフォルト: 10)
  - `category`: カテゴリでフィルタ
  - `tag`: タグでフィルタ

**レスポンス:**
```json
{
  "articles": [Article],
  "total": number,
  "page": number,
  "limit": number
}
```

### 2. 記事作成
- **POST** `/api/articles`
- **リクエストボディ:** `CreateArticleRequest`

**レスポンス:**
```json
{
  "message": "記事が作成されました"
}
```

### 3. 記事取得
- **GET** `/api/articles/{id}`

**レスポンス:** `Article`

### 4. 記事更新
- **PUT** `/api/articles/{id}`
- **リクエストボディ:** `UpdateArticleRequest`

**レスポンス:**
```json
{
  "message": "記事が更新されました"
}
```

### 5. 記事削除
- **DELETE** `/api/articles/{id}`

**レスポンス:**
```json
{
  "message": "記事が削除されました"
}
```

## エラーレスポンス

### 400 Bad Request
```json
{
  "error": "バリデーションエラーメッセージ"
}
```

### 404 Not Found
```json
{
  "error": "記事が見つかりません"
}
```

### 500 Internal Server Error
```json
{
  "error": "サーバーエラーメッセージ"
}
```

## 実装予定機能

- [ ] Deno KVとの連携
- [ ] バリデーション機能
- [ ] 認証・認可機能
- [ ] ページネーション機能
- [ ] 検索機能
- [ ] カテゴリ・タグ管理機能 