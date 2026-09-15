export type Rarity = '伝説' | '超激レア' | '激レア' | 'レア';
export type Role = 'アタッカー' | 'ディフェンダー' | 'サポート' | 'コントロール';

export type Character = {
  id: string;
  name: string;
  reading: string;
  faction: string;
  role: Role;
  rarity: Rarity;
  element: string;
  color: string;
  stats: { label: string; value: number }[];
  description: string;
  tags: string[];
  tier: string;
  update: string;
};

export type Medal = {
  id: string;
  name: string;
  rarity: Rarity;
  category: string;
  effect: string;
  detail: string;
  color: string;
  tags: string[];
};

export const characters: Character[] = [
  {
    id: 'kurogane-ran',
    name: '黒鉄 蘭',
    reading: 'くろがね らん',
    faction: '黒曜軍',
    role: 'アタッカー',
    rarity: '伝説',
    element: '斬撃',
    color: '#1e5aa8',
    stats: [{ label: '攻撃', value: 96 }, { label: '防御', value: 72 }, { label: '速度', value: 84 }, { label: '支援', value: 48 }],
    description: '前線の流れを一人で変える黒曜軍の切り込み隊長。連撃後の追撃が強力で、短い決戦を得意とする。',
    tags: ['速攻', '連撃', '前衛'],
    tier: 'S',
    update: '2024.06.18',
  },
  {
    id: 'asagiri-ibuki',
    name: '朝霧 伊吹',
    reading: 'あさぎり いぶき',
    faction: '白嶺衆',
    role: 'コントロール',
    rarity: '超激レア',
    element: '氷結',
    color: '#287fa6',
    stats: [{ label: '攻撃', value: 68 }, { label: '防御', value: 58 }, { label: '速度', value: 76 }, { label: '支援', value: 95 }],
    description: '敵の行動順を凍らせて盤面を組み替える白嶺の策士。耐久戦では味方の一手を確実に増やす。',
    tags: ['速度操作', '氷結', '中衛'],
    tier: 'S',
    update: '2024.06.12',
  },
  {
    id: 'tsukishiro-gai',
    name: '月城 凱',
    reading: 'つきしろ がい',
    faction: '月影隊',
    role: 'ディフェンダー',
    rarity: '伝説',
    element: '天雷',
    color: '#39469a',
    stats: [{ label: '攻撃', value: 61 }, { label: '防御', value: 98 }, { label: '速度', value: 42 }, { label: '支援', value: 74 }],
    description: '味方への攻撃を引き受ける月影隊の盾役。被弾を重ねるほど硬くなり、終盤の逆転を支える。',
    tags: ['挑発', '耐久', '守備'],
    tier: 'A+',
    update: '2024.06.10',
  },
  {
    id: 'suiren-noa',
    name: '水蓮 ノア',
    reading: 'すいれん のあ',
    faction: '蒼海連合',
    role: 'サポート',
    rarity: '超激レア',
    element: '水流',
    color: '#1d8a99',
    stats: [{ label: '攻撃', value: 52 }, { label: '防御', value: 62 }, { label: '速度', value: 70 }, { label: '支援', value: 97 }],
    description: '盤面全体に再生と行動ゲージを配る蒼海連合の航海士。編成の安定感を一段引き上げる。',
    tags: ['回復', '加速', '後衛'],
    tier: 'A+',
    update: '2024.06.06',
  },
  {
    id: 'akabane-shion',
    name: '赤羽 紫苑',
    reading: 'あかばね しおん',
    faction: '紅蓮衆',
    role: 'アタッカー',
    rarity: '激レア',
    element: '炎熱',
    color: '#b64b39',
    stats: [{ label: '攻撃', value: 91 }, { label: '防御', value: 43 }, { label: '速度', value: 88 }, { label: '支援', value: 36 }],
    description: '火傷を積み重ねて敵の防御を崩す紅蓮の舞手。対ボス戦での継続火力に秀でる。',
    tags: ['火傷', '継続火力', '中衛'],
    tier: 'A',
    update: '2024.05.29',
  },
  {
    id: 'mizunashi-ren',
    name: '水無瀬 蓮',
    reading: 'みなせ れん',
    faction: '白嶺衆',
    role: 'ディフェンダー',
    rarity: 'レア',
    element: '霧影',
    color: '#537986',
    stats: [{ label: '攻撃', value: 47 }, { label: '防御', value: 81 }, { label: '速度', value: 59 }, { label: '支援', value: 66 }],
    description: '霧をまとい攻撃を受け流す守備の名手。序盤から入手しやすく、育成効率も良い。',
    tags: ['回避', '低コスト', '守備'],
    tier: 'B+',
    update: '2024.05.21',
  },
];

export const medals: Medal[] = [
  { id: 'gekka-no-shirabe', name: '月華の調べ', rarity: '伝説', category: '攻撃強化', effect: '斬撃属性の与ダメージ +18%', detail: '会心発生時、次の攻撃に月光印を付与。月光印は最大3回まで累積する。', color: '#304e96', tags: ['斬撃', '会心', 'アタッカー'] },
  { id: 'shirogane-kekkai', name: '白銀結界', rarity: '伝説', category: '防御強化', effect: '初回被弾ダメージ -32%', detail: '戦闘開始から8秒間、味方全体の防御を底上げする。耐久編成の軸となる一枚。', color: '#648da1', tags: ['耐久', '開始時', 'ディフェンダー'] },
  { id: 'sazanami-no-in', name: '漣の印', rarity: '超激レア', category: '速度強化', effect: '行動ゲージ獲得量 +12%', detail: 'HPが70%以上の間、行動ゲージ獲得量がさらに5%増加する。先手を取りたい編成向け。', color: '#31889a', tags: ['速度', '先手', 'サポート'] },
  { id: 'guren-kassai', name: '紅蓮喝采', rarity: '超激レア', category: '状態異常', effect: '火傷の効果時間 +2秒', detail: '火傷状態の敵への攻撃時、与えるダメージが10%増加する。継続火力と好相性。', color: '#ad4b3a', tags: ['火傷', '継続火力'] },
  { id: 'kage-nui', name: '影縫い', rarity: '激レア', category: '妨害', effect: '速度デバフの成功率 +15%', detail: '敵の速度を下げる効果が命中した時、低確率で追加の行動遅延を発生させる。', color: '#5c538f', tags: ['妨害', '速度操作'] },
  { id: 'ao-no-kosen', name: '蒼の光線', rarity: 'レア', category: '回復支援', effect: '回復量 +11%', detail: '回復を受けた味方の被ダメージを4秒間、8%軽減する。安定攻略の入門メダル。', color: '#4c8296', tags: ['回復', '軽減', '初心者'] },
];

export const updates = [
  { date: '06.18', title: '黒鉄 蘭の最新評価を更新', category: 'キャラクター' },
  { date: '06.16', title: '第4章「霧海の砦」攻略メモを追加', category: '攻略情報' },
  { date: '06.12', title: '新メダル「漣の印」データを登録', category: 'メダル' },
  { date: '06.09', title: 'サポート編成シミュレーターを公開', category: 'ツール' },
];

export const popularSearches = ['黒鉄 蘭', '月華の調べ', '速度編成', '第4章 霧海の砦'];

export const articles = [
  { id: 'mist-fortress', type: '攻略記事', title: '第4章「霧海の砦」攻略メモ', summary: '初見で押さえたいギミックと、安定して突破するための編成例。', date: '2024.06.16', readTime: '8 min' },
  { id: 'speed-build', type: '編成ガイド', title: '先手を取る速度編成の組み方', summary: '速度タグを無駄なく重ねるためのキャラクターとメダルを紹介。', date: '2024.06.14', readTime: '5 min' },
  { id: 'new-player', type: '初心者ガイド', title: '序盤に育てたいキャラクター5選', summary: '手持ちが少ない時期でも長く使える、育成優先度の高いキャラクター。', date: '2024.06.10', readTime: '6 min' },
];

export function getCharacter(id?: string) {
  return characters.find((character) => character.id === id);
}

export function getMedal(id?: string) {
  return medals.find((medal) => medal.id === id);
}