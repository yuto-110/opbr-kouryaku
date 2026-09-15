# データ入力ガイド

このドキュメントでは、キャラクター、メダル、イベントデータをシステムに追加する方法を説明します。

**⚠️ 重要: 以下の操作は管理者のみが実行できます。**

---

## 📝 概要

すべてのゲームデータは `artifacts/game-guide-wiki/src/data/mockData.ts` で管理されています。

このファイルを編集することで、自動的にサイト全体に反映されます。HTMLを編集する必要はありません。

---

## 🔑 管理者認証

### 管理者の設定

`mockData.ts` の先頭に以下を追加してください：

```typescript
export const ADMIN_PASSWORD = "your-secure-password"; // GitHubで別管理
```

実際には、環境変数として管理してください：

```bash
# .env.local
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

### フロントエンドでの認証チェック

管理画面やデータ編集機能では、以下のように認証を確認してください：

```typescript
const isAdmin = localStorage.getItem('adminToken') === process.env.VITE_ADMIN_TOKEN;

if (!isAdmin) {
  return <div>管理者のみアクセス可能です</div>;
}
```

---

## ✨ キャラクターデータの追加

### テンプレート

```typescript
{
  id: 'unique-character-id',           // URL safe ID (小文字、ハイフン使用)
  name: 'キャラクター名',
  reading: 'よみがな',
  faction: '所属勢力',
  role: 'アタッカー',                   // or ディフェンダー, サポート, コントロール
  rarity: '伝説',                       // or 超激レア, 激レア, レア
  element: '属性',
  color: '#1e5aa8',                    // カラーコード（16進法）
  stats: [
    { label: '攻撃', value: 96 },
    { label: '防御', value: 72 },
    { label: '速度', value: 84 },
    { label: '支援', value: 48 }
  ],
  description: 'キャラクターの説明文。このキャラクターの特徴や戦い方について記載',
  tags: ['タグ1', 'タグ2', 'タグ3'],
  tier: 'S',                            // S, A+, A, B+ など
  update: '2024.06.18',                // 更新日
  skills: [
    {
      name: 'スキル名',
      description: 'スキルの説明。どんな効果があるか',
      cooldown: 5                       // クールタイム（秒）
    },
    {
      name: 'スキル名2',
      description: 'スキル2の説明',
      cooldown: 8
    }
  ],
  traits: [
    {
      name: '特性名',
      effect: '特性の効果について記載'
    },
    {
      name: '特性名2',
      effect: '特性2の効果'
    }
  ],
  strengths: [
    '強い点1',
    '強い点2',
    '強い点3'
  ],
  weaknesses: [
    '弱い点1',
    '弱い点2',
    '弱い点3'
  ],
  recommendedMedals: [
    'medal-id-1',
    'medal-id-2'
  ],
  relatedCharacters: [
    'character-id-1',
    'character-id-2'
  ]
}
```

### 例

```typescript
{
  id: 'yamato-takeshi',
  name: '大和 武士',
  reading: 'やまと たけし',
  faction: '蒼海連合',
  role: 'アタッカー',
  rarity: 'レア',
  element: '斬撃',
  color: '#0891b2',
  stats: [
    { label: '攻撃', value: 85 },
    { label: '防御', value: 55 },
    { label: '速度', value: 79 },
    { label: '支援', value: 42 }
  ],
  description: '蒼海連合の新星剣士。素早い剣技で敵を翻弄し、複数の敵を同時に処理するのが得意。',
  tags: ['速攻', '連撃', 'リセット'],
  tier: 'A',
  update: '2024.06.20',
  skills: [
    {
      name: '流星剣',
      description: '敵に高速連撃。敵の防御を無視した固定ダメージも付与',
      cooldown: 5
    },
    {
      name: 'ウェーブカッター',
      description: '敵全体に波状の斬撃。敵の防御-10%が3ターン継続',
      cooldown: 8
    }
  ],
  traits: [
    {
      name: '剣の極意',
      effect: 'クリティカル時、次の攻撃の威力+25%'
    },
    {
      name: '波状斬撃',
      effect: '連撃時、敵全体にダメージの10%を追加ダメージとして与える'
    }
  ],
  strengths: [
    '複数敵処理が得意',
    '速度が高く先手を取れる',
    'クリティカル率が高い'
  ],
  weaknesses: [
    '防御が低め',
    '単体ボスには火力が不足',
    '状態異常への耐性がない'
  ],
  recommendedMedals: ['gekka-no-shirabe', 'sazanami-no-in'],
  relatedCharacters: ['kurogane-ran', 'kazuki-hana']
}
```

---

## 🏅 メダルデータの追加

### テンプレート

```typescript
{
  id: 'unique-medal-id',               // URL safe ID
  name: 'メダル名',
  rarity: '伝説',                       // or 超激レア, 激レア, レア
  category: 'カテゴリー',               // 攻撃強化, 防御強化, 速度強化 など
  effect: 'メダルの主な効果',           // 短い説明
  detail: 'メダルの詳しい説明文。効果の詳細や追加効果について記載',
  color: '#fbbf24',                    // カラーコード
  tags: ['タグ1', 'タグ2'],
  recommendedCharacters: [
    'character-id-1',
    'character-id-2'
  ]
}
```

### 例

```typescript
{
  id: 'tatsumaki-no-kiba',
  name: '竜巻の牙',
  rarity: '超激レア',
  category: '攻撃強化',
  effect: '風属性の与ダメージ +17%',
  detail: '風属性キャラの攻撃力を大幅アップ。複数敵への攻撃時に威力が+25%になる追加効果あり。敵の防御が高いほど効果が増加。',
  color: '#10b981',
  tags: ['攻撃', '風属性', '複数敵'],
  recommendedCharacters: ['kazuki-hana', 'yamato-takeshi']
}
```

---

## 🎉 イベントデータの追加

### テンプレート

```typescript
{
  id: 'unique-event-id',               // URL safe ID
  name: 'イベント名',
  type: 'gacha',                       // challenge-battle, mission, campaign, other
  startDate: new Date('2024-06-20'),   // 開始日時
  endDate: new Date('2024-07-05'),     // 終了日時
  overview: 'イベントの説明文。何をするイベントか、どんな報酬があるか',
  color: '#1e5aa8',                    // イベントカラー
  rewards: [
    '報酬1',
    '報酬2',
    '報酬3'
  ],
  rules: 'イベントのルール（オプション）',
  missions: [                          // オプション
    {
      title: 'ミッション名',
      description: 'ミッションの説明',
      condition: 'クリア条件',
      reward: '報酬'
    }
  ]
}
```

### 例

```typescript
{
  id: 'event-collab-hero',
  name: 'コラボレーション「ヒーローズアライアンス」',
  type: 'campaign',
  startDate: new Date('2024-07-20'),
  endDate: new Date('2024-08-20'),
  overview: '大人気アニメ「ヒーローズアライアンス」とのコラボレーション！限定キャラクター「フェニックス戦士」が登場。',
  color: '#dc2626',
  rewards: [
    '限定キャラクター「フェニックス戦士」',
    'コラボメダル「炎の継承」',
    'コラボ限定スキン',
    'ダイヤ 500個'
  ],
  rules: 'キャラクターガチャで限定キャラが登場。ガチャ確率は通常の1.5倍にアップ。',
  missions: [
    {
      title: 'コラボガチャに100回挑戦',
      description: 'コラボガチャを合計100回引く',
      condition: 'ガチャ100回',
      reward: 'ダイヤ 100個'
    },
    {
      title: 'コラボキャラを入手',
      description: 'コラボキャラクター「フェニックス戦士」を入手する',
      condition: 'キャラ入手',
      reward: 'レアメダルピース ×5'
    },
    {
      title: 'コラボステージクリア',
      description: 'コラボ限定ステージ「炎の試練」をクリア',
      condition: 'ステージクリア',
      reward: 'コラボメダル「炎の継承」'
    }
  ]
}
```

---

## 🏷️ タグの追加

### テンプレート

```typescript
{
  id: 'unique-tag-id',
  name: 'タグ名',
  category: 'role',                    // role, element, faction, effect, other
  description: 'タグの説明',
  color: '#ff0000'                     // カラーコード
}
```

### 例

```typescript
{
  id: 'tag-wind-attr',
  name: '風属性',
  category: 'element',
  description: '風属性のキャラクターやメダル',
  color: '#10b981'
}
```

---

## 🚀 データを追加したら

1. `artifacts/game-guide-wiki/src/data/mockData.ts` を編集
2. 配列（`characters`, `medals`, `events`, `tags`）に新しいデータを追加
3. ファイルを保存
4. Gitにコミット・プッシュ
5. サイトをリロード → 自動的に反映される

---

## ✅ 確認チェックリスト

データを追加する前に、以下をチェックしてください：

### キャラクター
- [ ] `id` は重複していないか？
- [ ] 必要なフィールドがすべて入力されているか？
- [ ] `stats` の値は 0 ～ 100 の範囲か？
- [ ] `recommendedMedals` に存在するメダルIDのみ指定したか？
- [ ] `relatedCharacters` に存在するキャラクターIDのみ指定したか？
- [ ] `rarity` は正しい選択肢か？（伝説、超激レア、激レア、レア）
- [ ] `role` は正しい選択肢か？（アタッカー、ディフェンダー、サポート、コントロール）

### メダル
- [ ] `id` は重複していないか？
- [ ] `rarity` は正しい選択肢か？
- [ ] `recommendedCharacters` に存在するキャラクターIDのみ指定したか？
- [ ] `category` は統一されているか？

### イベント
- [ ] `id` は重複していないか？
- [ ] `startDate` と `endDate` は正しい形式か？
- [ ] `startDate` < `endDate` か？
- [ ] `type` は正しい選択肢か？
- [ ] ミッションがある場合、すべて記入されているか？

---

## 🔍 デバッグ方法

データが反映されない場合：

1. ブラウザのキャッシュをクリア
2. コンソールでエラーを確認
3. IDの重複チェック
4. 必須フィールドの確認
5. TypeScript の型エラーを確認

---

## 📱 レスポンシブ確認

新しいデータを追加したら、以下で確認してください：

- **PC版**: `/characters`, `/medals`, `/events`
- **モバイル版**: 同じURLをモバイル表示で確認
- **詳細ページ**: `/characters/{id}`, `/medals/{id}`, `/events/{id}`

---

## 🔒 セキュリティに関する注意

- **管理者IDとパスワードは絶対に共有しないでください**
- **環境変数は `.env.local` で管理し、GitHubに上げないでください**
- **本番環境のパスワードは定期的に変更してください**

---

## 📞 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。

