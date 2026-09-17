# Implementation Status

## 現在の実装状況

### Frontend
- [x] ホームページ
- [x] キャラクター一覧 `/characters` — MongoDB APIから取得
- [x] キャラクター詳細 `/characters/:id` — MongoDB APIから取得
- [x] メダル一覧・詳細（既存UI）
- [x] サポート編成（既存UI）
- [x] 攻略記事（既存UI）
- [x] ランキング（既存UI）
- [x] マイページ（既存UI）
- [x] ログイン・新規登録 `/auth`
- [x] 管理ダッシュボード `/admin`
- [x] キャラクター管理 `/admin/characters`
  - [x] 一覧
  - [x] 検索
  - [x] 新規登録
  - [x] 編集
  - [x] 削除
  - [x] GitHub assetsへの画像アップロード
- [x] PC / モバイルの既存レスポンシブUIを継続利用

### Backend
- [x] Express
- [x] MongoDB / Mongoose
- [x] JWT認証
- [x] admin権限チェック
- [x] `GET /api/characters`
- [x] `GET /api/characters/:id`
- [x] `POST /api/characters`
- [x] `PUT /api/characters/:id`
- [x] `DELETE /api/characters/:id`
- [x] `GET /api/users/me`
- [x] 所持キャラクターAPI
- [x] GitHub assets画像アップロードAPI
- [x] API JSON body 12MB

### 画像
- メインリポジトリとは別の公開リポジトリ `yuto-110/opbr-kouryaku-assets` を使用
- フォルダは `characters/`, `medals/`, `team-boost/`
- API側のGitHub PATは環境変数 `GITHUB_ASSETS_TOKEN` に保存する
- PAT自体をコードやチャットに保存しない

## 次の未実装領域

- メダル管理画面
- イベント管理画面
- 記事管理画面
- タグ管理画面
- メダルAPI
- イベントAPI
- 検索API
- 所持キャラクターUIの完全実装
- 編成自動生成
- AI機能
- 実際のゲームデータの大量投入
- 断片/育成素材の実消費処理
- MongoDBの古いテストデータ整理

※このファイルは、以前の「Phase 4/5/7が未実装」という古い記述を、現在の実装状態に合わせて更新したもの。
