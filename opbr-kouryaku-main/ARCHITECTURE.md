# OPBR Wiki - Architecture & Development Plan

## 📋 プロジェクト概要

ゲームの攻略情報、キャラクター、メダル、サポート、イベントをまとめたWiki・データベースサイト。
単なる攻略記事ではなく、以下を組み合わせた包括的なサイトを目指します。

- ゲームデータベース
- 攻略Wiki
- ユーザーの編成管理
- 編成自動生成
- AIによる編成提案

## 🏗️ データベース設計

### MongoDB コレクション構成

#### users
```typescript
{
  _id: ObjectId,
  username: string,
  email: string,
  passwordHash: string,
  role: 'user' | 'admin',
  ownedCharacters: Array<{characterId: string, level: number}>,
  favoriteCharacters: string[],
  savedSupportTeams: Array<{name: string, characterIds: string[]}>,
  savedMedalTeams: Array<{name: string, medalIds: string[]}>,
  createdAt: Date,
  updatedAt: Date
}
```

#### characters
```typescript
{
  _id: ObjectId,
  id: string (unique),
  name: string,
  reading: string,
  faction: string,
  role: 'アタッカー' | 'ディフェンダー' | 'サポート' | 'コントロール',
  rarity: '伝説' | '超激レア' | '激レア' | 'レア',
  element: string,
  color: string,
  stats: {
    攻撃: number,
    防御: number,
    速度: number,
    支援: number
  },
  skills: Array<{
    name: string,
    description: string,
    cooldown: number
  }>,
  traits: Array<{
    name: string,
    effect: string
  }>,
  tags: string[],
  tier: string,
  imageUrl: string,
  strengths: string[],
  weaknesses: string[],
  recommendedMedals: string[],
  relatedCharacters: string[],
  implementedAt: Date,
  updatedAt: Date
}
```

#### medals
```typescript
{
  _id: ObjectId,
  id: string (unique),
  name: string,
  rarity: '伝説' | '超激レア' | '激レア' | 'レア',
  category: string,
  effect: string,
  detail: string,
  color: string,
  tags: string[],
  imageUrl: string,
  recommendedCharacters: string[],
  recommendedTeams: Array<{
    name: string,
    characterIds: string[]
  }>,
  implementedAt: Date,
  updatedAt: Date
}
```

#### tags
```typescript
{
  _id: ObjectId,
  name: string (unique),
  category: 'character' | 'medal' | 'both',
  description: string,
  color: string,
  createdAt: Date
}
```

#### events
```typescript
{
  _id: ObjectId,
  id: string (unique),
  name: string,
  type: 'challenge-battle' | 'mission' | 'campaign' | 'gacha' | 'other',
  imageUrl: string,
  startDate: Date,
  endDate: Date,
  overview: string,
  rules: string,
  rewards: Array<{
    name: string,
    quantity: number
  }>,
  missions: Array<{
    title: string,
    description: string,
    condition: string,
    reward: {
      name: string,
      quantity: number
    }
  }>,
  status: 'scheduled' | 'ongoing' | 'ended',
  updatedAt: Date
}
```

#### articles
```typescript
{
  _id: ObjectId,
  id: string (unique),
  title: string,
  thumbnail: string,
  content: string,
  category: string,
  tags: string[],
  publishedAt: Date,
  updatedAt: Date,
  views: number,
  author: string
}
```

## 🗂️ ファイル構成

### Frontend (artifacts/game-guide-wiki)
```
src/
├── pages/               # ページコンポーネント
│   ├── home.tsx
│   ├── characters.tsx
│   ├── character-detail.tsx
│   ├── medals.tsx
│   ├── medal-detail.tsx
│   ├── support.tsx
│   ├── strategy.tsx
│   ├── rankings.tsx
│   ├── mypage.tsx
│   └── not-found.tsx
├── components/          # 再利用可能なコンポーネント
│   ├── guide-shell.tsx
│   ├── error-boundary.tsx
│   └── ui/             # Radix UI ラッパー
├── data/               # モックデータ & API クライアント
│   └── mockData.ts
├── hooks/              # カスタムフック
├── lib/                # ユーティリティ
├── styles/             # グローバルスタイル
├── App.tsx
└── main.tsx
```

### Backend (artifacts/api-server)
```
src/
├── routes/
│   ├── characters.ts
│   ├── medals.ts
│   ├── events.ts
│   ├── articles.ts
│   ├── users.ts
│   └── teams.ts
├── controllers/
├── services/
│   ├── team-optimizer.ts    # 編成最適化ロジック
│   ├── event-status.ts      # イベント状態判定
│   └── search.ts
├── db/
│   ├── schemas.ts           # Drizzle スキーマ
│   └── seed.ts              # ダミーデータ
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   └── error-handler.ts
└── index.ts
```

## 🚀 開発フェーズ

### Phase 1: 既存コード分析 ✅ 完了
- [x] リポジトリ構造分析
- [x] データベース設計
- [x] ページ構成確認

### Phase 2: ダミーデータ拡張 & 詳細ページ実装
- キャラクターデータ20～30個に拡張
- メダルデータ15～20個に拡張
- タグシステム実装
- キャラクター詳細ページ完全実装
- メダル詳細ページ完全実装
- 検索・フィルター機能強化

### Phase 3: イベントDB実装
- イベント一覧ページ
- イベント詳細ページ
- イベント状態の自動判定
- トップページへイベント表示

### Phase 4: MongoDB & API実装
- MongoDB接続
- REST API エンドポイント作成
- フロントエンド ↔ バックエンド通信

### Phase 5: ユーザー認証
- ユーザー登録
- ログイン機能
- JWT認証
- マイページ機能

### Phase 6: 編成自動生成
- サポート編成最適化ロジック
- メダル編成最適化ロジック
- 条件フィルタリング

### Phase 7: 管理画面
- キャラクター管理
- メダル管理
- イベント管理
- 記事管理

### Phase 8: AI機能
- OpenAI API統合
- 編成提案
- 攻略説明生成

## 🛠️ 技術スタック

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Wouter (ルーティング)
- React Query (@tanstack/react-query)
- React Hook Form
- Zod (バリデーション)

### Backend
- Node.js
- Express
- TypeScript
- Drizzle ORM
- MongoDB / MongoDB Atlas
- JWT (認証)
- Zod (バリデーション)

### Deployment
- Render

## 📝 重要なルール

1. **既存コード再利用**: GuideShell、カードコンポーネント、スタイルシステムはすべて維持
2. **段階的開発**: 一度にすべてを実装しない
3. **型安全性**: TypeScript を活用
4. **プレースホルダー画像**: 著作権対策として ArtPlaceholder コンポーネントを使用
5. **セキュリティ**: パスワード平文保存禁止、環境変数使用、入力値検証

## 🎯 最終目標

- ゲーム攻略サイト、Wikiの機能を兼ね備えた包括的サイト
- ユーザーが所持キャラから編成を自動生成できる
- AIによる編成提案・攻略説明
- PC/モバイル完全対応
- 管理画面からノーコードでデータ追加可能
