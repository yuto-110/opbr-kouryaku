export type Rarity = '伝説' | '超激レア' | '激レア' | 'レア';
export type Role = 'アタッカー' | 'ディフェンダー' | 'サポート' | 'コントロール';
export type EventType = 'challenge-battle' | 'mission' | 'campaign' | 'gacha' | 'other';
export type EventStatus = 'scheduled' | 'ongoing' | 'ended';

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
  skills: Array<{ name: string; description: string; cooldown: number }>;
  traits: Array<{ name: string; effect: string }>;
  strengths: string[];
  weaknesses: string[];
  recommendedMedals: string[];
  relatedCharacters: string[];
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
  recommendedCharacters: string[];
};

export type Tag = {
  id: string;
  name: string;
  category: 'role' | 'element' | 'faction' | 'effect' | 'other';
  description: string;
  color: string;
};

export type GameEvent = {
  id: string;
  name: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  overview: string;
  color: string;
  rewards: string[];
  missions?: Array<{ title: string; condition: string; reward: string }>;
};

export type Article = {
  id: string;
  type: string;
  title: string;
  summary: string;
  date: string;
  views?: number;
};

export const tags: Tag[] = [
  // Roles
  { id: 'role-attacker', name: 'アタッカー', category: 'role', description: '高い攻撃力で敵を倒す役職', color: '#ef4444' },
  { id: 'role-defender', name: 'ディフェンダー', category: 'role', description: '敵の攻撃を受け止める役職', color: '#3b82f6' },
  { id: 'role-support', name: 'サポート', category: 'role', description: '味方を支援する役職', color: '#10b981' },
  { id: 'role-control', name: 'コントロール', category: 'role', description: '戦場を操るコントロール役', color: '#f59e0b' },
  // Elements
  { id: 'elem-slash', name: '斬撃', category: 'element', description: '斬撃属性のキャラクター', color: '#1e5aa8' },
  { id: 'elem-ice', name: '氷結', category: 'element', description: '氷結属性のキャラクター', color: '#287fa6' },
  { id: 'elem-thunder', name: '天雷', category: 'element', description: '天雷属性のキャラクター', color: '#39469a' },
  { id: 'elem-water', name: '水流', category: 'element', description: '水流属性のキャラクター', color: '#1d8a99' },
  { id: 'elem-fire', name: '炎熱', category: 'element', description: '炎熱属性のキャラクター', color: '#b64b39' },
  { id: 'elem-shadow', name: '霧影', category: 'element', description: '霧影属性のキャラクター', color: '#537986' },
  // Factions
  { id: 'faction-kokuyo', name: '黒曜軍', category: 'faction', description: '黒曜軍所属', color: '#1e40af' },
  { id: 'faction-hakurei', name: '白嶺衆', category: 'faction', description: '白嶺衆所属', color: '#60a5fa' },
  { id: 'faction-tsugage', name: '月影隊', category: 'faction', description: '月影隊所属', color: '#6366f1' },
  { id: 'faction-kaiyou', name: '蒼海連合', category: 'faction', description: '蒼海連合所属', color: '#0891b2' },
  { id: 'faction-guren', name: '紅蓮衆', category: 'faction', description: '紅蓮衆所属', color: '#dc2626' },
  // Effects
  { id: 'effect-speed', name: '速攻', category: 'effect', description: '素早く敵を倒す戦略', color: '#a78bfa' },
  { id: 'effect-combo', name: '連撃', category: 'effect', description: '複数回の攻撃を繰り出す', color: '#f472b6' },
  { id: 'effect-tank', name: '耐久', category: 'effect', description: '高い耐久力を持つ', color: '#34d399' },
  { id: 'effect-debuff', name: '妨害', category: 'effect', description: '敵の能力を低下させる', color: '#fbbf24' },
  { id: 'effect-heal', name: '回復', category: 'effect', description: '味方を回復させる', color: '#4ade80' },
  { id: 'effect-buff', name: '強化', category: 'effect', description: '味方の能力を強化する', color: '#60a5fa' },
  { id: 'effect-burn', name: '火傷', category: 'effect', description: '火傷状態異常を使用', color: '#f97316' },
];

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
    tags: ['速攻', '連撃', '前衛', '高攻撃'],
    tier: 'S',
    update: '2024.06.18',
    skills: [
      { name: '流星斬', description: '単体に高威力の斬撃を与える。連撃でクリティカル率UP', cooldown: 5 },
      { name: '閃光追撃', description: '敵をリセット。与ダメージ+20%', cooldown: 8 },
    ],
    traits: [
      { name: '先手必勝', effect: '速度が高いほどダメージUP' },
      { name: '流星の遺志', effect: '連撃時、次の攻撃のクリティカル率+30%' },
    ],
    strengths: ['初手の火力が非常に高い', '連撃による継続ダメージ', '速度が高い'],
    weaknesses: ['防御が低め', '耐久戦に弱い', '支援が少ない'],
    recommendedMedals: ['gekka-no-shirabe', 'sazanami-no-in'],
    relatedCharacters: ['asagiri-ibuki', 'suiren-noa'],
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
    tags: ['速度操作', '氷結', '中衛', '高支援'],
    tier: 'S',
    update: '2024.06.12',
    skills: [
      { name: '氷結の罠', description: '敵を凍結させ行動を遅延。3ターン効果', cooldown: 6 },
      { name: '盤面再構成', description: 'ターン順を再計算。味方の行動ゲージ+30%', cooldown: 10 },
    ],
    traits: [
      { name: '氷の知略', effect: 'コントロールスキル成功時、支援+15%' },
      { name: '白嶺の加護', effect: '味方の防御+10%（常時）' },
    ],
    strengths: ['戦場操作能力が高い', '支援能力に優れている', 'サポートとの相性が良い'],
    weaknesses: ['自身の攻撃力が低い', '単体攻撃力不足', 'ボス戦では活躍が限定的'],
    recommendedMedals: ['shirogane-kekkai', 'kage-nui'],
    relatedCharacters: ['mizunashi-ren', 'tsukishiro-gai'],
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
    tags: ['挑発', '耐久', '守備', '高防御'],
    tier: 'A+',
    update: '2024.06.10',
    skills: [
      { name: '盾壁', description: '味方全体をかばう。ダメージ-25%（自分が受ける）', cooldown: 7 },
      { name: '復讐の雷', description: '被弾した分のダメージを敵全体に与える', cooldown: 9 },
    ],
    traits: [
      { name: '不屈の盾', effect: '被弾するたび防御+3%（最大50%）' },
      { name: '月影の加護', effect: '被弾時、防御+5%（ターン終了時までの間）' },
    ],
    strengths: ['防御能力が最高レベル', '長期戦に強い', 'ボス戦での安定性'],
    weaknesses: ['速度が低い', '攻撃力が低い', '短期決戦には不向き'],
    recommendedMedals: ['shirogane-kekkai', 'guren-kassai'],
    relatedCharacters: ['kurogane-ran', 'suiren-noa'],
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
    tags: ['回復', '加速', '後衛', '高支援'],
    tier: 'A+',
    update: '2024.06.06',
    skills: [
      { name: '癒しの波動', description: '味方全体を回復。HP+35%（現在のHPの比率）', cooldown: 5 },
      { name: '潮流加速', description: '味方全体の行動ゲージ+40%', cooldown: 8 },
    ],
    traits: [
      { name: '海の恩恵', effect: '毎ターン味方全体の防御+3%' },
      { name: '根気強い', effect: '回復スキル使用時、クールタイム-1' },
    ],
    strengths: ['支援能力が最高レベル', 'チーム全体を強化', 'どの編成にも対応可能'],
    weaknesses: ['自身の防御が低め', '攻撃力がない', '単体では活躍不可'],
    recommendedMedals: ['ao-no-kosen', 'sazanami-no-in'],
    relatedCharacters: ['asagiri-ibuki', 'akabane-shion'],
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
    tags: ['火傷', '継続火力', '中衛', '高攻撃'],
    tier: 'A',
    update: '2024.05.29',
    skills: [
      { name: '火炎舞', description: '敵に火傷を付与。3ターン継続ダメージ', cooldown: 4 },
      { name: '防御崩し', description: '火傷状態の敵へのダメージ+50%', cooldown: 6 },
    ],
    traits: [
      { name: '炎の舞い手', effect: '火傷を付与するたび、次の攻撃に+20%ダメージ' },
      { name: '継続燃焼', effect: '敵の火傷ダメージ+30%' },
    ],
    strengths: ['ボス戦での継続火力', '速度が高い', 'DPS効率が良い'],
    weaknesses: ['防御が非常に低い', '単体攻撃中心', '状態異常耐性が低い'],
    recommendedMedals: ['guren-kassai', 'gekka-no-shirabe'],
    relatedCharacters: ['kurogane-ran', 'asagiri-ibuki'],
  },
  {
    id: 'mizunashi-ren',
    name: '水無瀬 蓮',
    reading: 'みなせ れん',
    faction: '白嶺衆',
    role: 'ディ���ェンダー',
    rarity: 'レア',
    element: '霧影',
    color: '#537986',
    stats: [{ label: '攻撃', value: 47 }, { label: '防御', value: 81 }, { label: '速度', value: 59 }, { label: '支援', value: 66 }],
    description: '霧をまとい攻撃を受け流す守備の名手。序盤から入手しやすく、育成効率も良い。',
    tags: ['回避', '低コスト', '守備'],
    tier: 'B+',
    update: '2024.05.21',
    skills: [
      { name: '霧の身', description: '敵の攻撃回避率+30%。3ターン効果', cooldown: 5 },
      { name: '受け流し', description: '被弾したダメージの20%を敵に反射', cooldown: 7 },
    ],
    traits: [
      { name: '霧の神出鬼没', effect: '回避成功時、敵の精度-10%' },
      { name: '安定した守備', effect: '防御スキル時、味方全体の防御+5%' },
    ],
    strengths: ['序盤入手可能', '育成効率が良い', '汎用性が高い'],
    weaknesses: ['ステータスが全体的に低め', '防御が専門（攻撃できない）', '終盤では活躍が限定的'],
    recommendedMedals: ['shirogane-kekkai'],
    relatedCharacters: ['asagiri-ibuki', 'suiren-noa'],
  },
  {
    id: 'kazuki-hana',
    name: '風月 花',
    reading: 'ふうげつ はな',
    faction: '白嶺衆',
    role: 'アタッカー',
    rarity: '超激レア',
    element: '斬撃',
    color: '#0d9488',
    stats: [{ label: '攻撃', value: 89 }, { label: '防御', value: 65 }, { label: '速度', value: 90 }, { label: '支援', value: 44 }],
    description: '風を操る白嶺の快刀。素早い連続攻撃で敵を圧倒する。',
    tags: ['速攻', '連撃', '中衛'],
    tier: 'A',
    update: '2024.06.01',
    skills: [
      { name: '風刃の連撃', description: '敵に3連撃。クリティカル率+40%', cooldown: 6 },
      { name: 'タイフーン', description: '敵全体に風属性攻撃。回避無視', cooldown: 9 },
    ],
    traits: [
      { name: '風の舞い', effect: '速度が高いほど攻撃UP（最大+30%）' },
      { name: '連撃特化', effect: '連撃時、ダメージ+15%' },
    ],
    strengths: ['速度が非常に高い', '連撃で複数敵処理', '避ける戦法が得意'],
    weaknesses: ['防御が低め', '耐久力不足', '単体ボスに弱い'],
    recommendedMedals: ['sazanami-no-in', 'gekka-no-shirabe'],
    relatedCharacters: ['kurogane-ran', 'akabane-shion'],
  },
  {
    id: 'yami-sadao',
    name: '闇 貞夫',
    reading: 'やみ さだお',
    faction: '黒曜軍',
    role: 'コントロール',
    rarity: '激レア',
    element: '霧影',
    color: '#4c1d95',
    stats: [{ label: '攻撃', value: 55 }, { label: '防御', value: 60 }, { label: '速度', value: 73 }, { label: '支援', value: 88 }],
    description: '影に隠れ策を巡らす黒曜軍の智者。敵の動きを制限する暗黒戦術に長ける。',
    tags: ['妨害', '行動制限', '後衛'],
    tier: 'A',
    update: '2024.05.30',
    skills: [
      { name: '暗黒の呪い', description: '敵の行動を封じる。1ターン行動不可', cooldown: 6 },
      { name: '影の網', description: '敵全体の速度-20%。3ターン効果', cooldown: 8 },
    ],
    traits: [
      { name: '影の支配者', effect: 'コントロールスキル成功時、支援+12%' },
      { name: '暗黒の威力', effect: '敵の状態異常蓄積時、与ダメージ+25%' },
    ],
    strengths: ['敵の行動制限に特化', '複数の妨害スキル', '長期戦に強い'],
    weaknesses: ['攻撃力が低い', '短期決戦に弱い', '支援依存度が高い'],
    recommendedMedals: ['kage-nui', 'guren-kassai'],
    relatedCharacters: ['asagiri-ibuki', 'kurogane-ran'],
  },
];

export const medals: Medal[] = [
  { id: 'gekka-no-shirabe', name: '月華の調べ', rarity: '伝説', category: '攻撃強化', effect: '斬撃属性の与ダメージ +18%', detail: '会心発生時、次の攻撃に月光印が付与。月光印が3つ蓄積すると敵の防御-15%', color: '#fbbf24', tags: ['攻撃', '斬撃', 'クリティカル'], recommendedCharacters: ['kurogane-ran', 'akabane-shion'] },
  { id: 'shirogane-kekkai', name: '白銀結界', rarity: '伝説', category: '防御強化', effect: '初回被弾ダメージ -32%', detail: '戦闘開始から8秒間、味方全体の防御+20%。以降、敵の攻撃を無効化できる確率が5%', color: '#60a5fa', tags: ['防御', '耐久', 'シールド'], recommendedCharacters: ['tsukishiro-gai', 'mizunashi-ren'] },
  { id: 'sazanami-no-in', name: '漣の印', rarity: '超激レア', category: '速度強化', effect: '行動ゲージ獲得量 +12%', detail: 'HPが70%以上の間、行動ゲージ獲得量が+20%に増加。速度依存スキルの効果+15%', color: '#a78bfa', tags: ['速度', '加速', '支援'], recommendedCharacters: ['kurogane-ran', 'kazuki-hana'] },
  { id: 'guren-kassai', name: '紅蓮喝采', rarity: '超激レア', category: '状態異常', effect: '火傷の効果時間 +2秒', detail: '火傷状態の敵への攻撃時、与えるダメージ+20%。火傷の継続ダメージ+30%', color: '#f97316', tags: ['火傷', '継続火力', '状態異常'], recommendedCharacters: ['akabane-shion', 'kurogane-ran'] },
  { id: 'kage-nui', name: '影縫い', rarity: '激レア', category: '妨害', effect: '速度デバフの成功率 +15%', detail: '敵の速度を下げる効果が命中した時、低確率で敵の行動を1ターン遅延。速度-15%の効果が2ターン継続', color: '#8b5cf6', tags: ['妨害', '速度低下', '行動制限'], recommendedCharacters: ['asagiri-ibuki', 'yami-sadao'] },
  { id: 'ao-no-kosen', name: '蒼の光線', rarity: 'レア', category: '回復支援', effect: '回復量 +11%', detail: '回復を受けた味方の被ダメージを4秒間、8%軽減する。回復スキル使用時のクールタイム-0.5秒', color: '#06b6d4', tags: ['回復', 'サポート', '支援'], recommendedCharacters: ['suiren-noa'] },
  { id: 'raijin-no-ie', name: '雷神の威', rarity: '超激レア', category: '攻撃強化', effect: '天雷属性の与ダメージ +16%', detail: '敵に状態異常を付与した時、敵の電撃耐性-10%。天雷スキル使用時の威力+25%', color: '#fbbf24', tags: ['攻撃', '天雷', '電撃'], recommendedCharacters: ['tsukishiro-gai'] },
  { id: 'suisou-no-nagare', name: '水装の流れ', rarity: '激レア', category: '防御強化', effect: '水流属性のダメージ軽減 +15%', detail: '水流属性の攻撃を受けた時、その威力の15%を回復。水流スキルの効果+20%', color: '#0ea5e9', tags: ['防御', '水流', '回復'], recommendedCharacters: ['suiren-noa'] },
  { id: 'kiryoku-no-katame', name: '鬼力の肩甲', rarity: '超激レア', category: '防御強化', effect: '最大HP +22%', detail: '被弾するたび防御+2%（最大30%）。敵の攻撃を受けるたび、次の自身の攻撃ダメージ+5%', color: '#ef4444', tags: ['防御', 'HP', '耐久'], recommendedCharacters: ['tsukishiro-gai', 'yami-sadao'] },
  { id: 'senkoku-no-tsurugi', name: '戦国の剣', rarity: '伝説', category: '攻撃強化', effect: '全属性の与ダメージ +14%', detail: '敵に与えたダメージの8%を自身の次の攻撃に乗せる。スキル威力+20%（最大スタック：5）', color: '#dc2626', tags: ['攻撃', 'クリティカル', '高威力'], recommendedCharacters: ['kurogane-ran'] },
];

export const updates = [
  { date: '06.18', title: '黒鉄 蘭の最新評価を更新', category: 'キャラクター' },
  { date: '06.16', title: '第4章「霧海の砦」攻略メモを追加', category: '攻略情報' },
  { date: '06.12', title: '新メダル「漣の印」データを登録', category: 'メダル' },
  { date: '06.09', title: 'サポート編成シミュレーターを公開', category: 'ツール' },
  { date: '06.05', title: 'キャラクター7体が追加', category: 'ゲーム更新' },
];

export const popularSearches = ['黒鉄 蘭', '月華の調べ', '速度編成', '第4章 霧海の砦', 'ディフェンダー', 'コントロール'];

export const articles = [
  { id: 'mist-fortress', type: '攻略記事', title: '第4章「霧海の砦」攻略メモ', summary: '初見で押さえたいギミックと、安定して突破するための編成例。', date: '2024.06.16', views: 1240 },
  { id: 'speed-build', type: '編成ガイド', title: '先手を取る速度編成の組み方', summary: '速度タグを無駄なく重ねるためのキャラクターとメダルを紹介。', date: '2024.06.10', views: 856 },
  { id: 'new-player', type: '初心者ガイド', title: '序盤に育てたいキャラクター5選', summary: '手持ちが少ない時期でも長く使える、育成優先度の高いキャ...', date: '2024.06.01', views: 2134 },
  { id: 'medal-guide', type: 'メダルガイド', title: 'メダルの効果的な組み合わせ', summary: 'どのメダルを組み合わせるかで編成の強さが決まる。相性の良い組み合わせを解説。', date: '2024.05.28', views: 945 },
  { id: 'support-tips', type: 'Tips', title: 'サポート役キャラの活躍法', summary: 'サポートキャラの適切な配置と運用で、チーム全体の火力が2倍に！', date: '2024.05.20', views: 678 },
];

export const events: GameEvent[] = [
  {
    id: 'event-gacha-new',
    name: '新キャラガチャ「黒曜軍の切り込み隊長」',
    type: 'gacha',
    startDate: new Date('2024-06-15'),
    endDate: new Date('2024-06-30'),
    overview: '新しく実装されたキャラクター「黒鉄 蘭」が登場！限定ガチャを開催中。',
    color: '#1e5aa8',
    rewards: ['新キャラクター「黒鉄 蘭」', 'メダル「月華の調べ」', 'ガチャチケット'],
  },
  {
    id: 'event-challenge-1',
    name: 'チャレンジバトル「影の要塞」',
    type: 'challenge-battle',
    startDate: new Date('2024-06-10'),
    endDate: new Date('2024-06-25'),
    overview: '毎日内容が変わる難易度の高いバトルに挑戦。クリアで豪華報酬獲得！',
    color: '#4c1d95',
    rewards: ['ゴールド 10,000', 'メダルピース', 'チャレンジチケット'],
    missions: [
      { title: '難易度 NORMAL をクリア', condition: 'バトルに勝利', reward: 'ゴールド 5,000' },
      { title: '難易度 HARD をクリア', condition: 'バトルに勝利', reward: 'ゴールド 10,000' },
      { title: '難易度 EXTREME をクリア', condition: 'バトルに勝利', reward: 'レアメダルピース' },
    ],
  },
  {
    id: 'event-mission-spring',
    name: '春祭りイベント「桜舞い散る」',
    type: 'mission',
    startDate: new Date('2024-05-20'),
    endDate: new Date('2024-06-05'),
    overview: '春祭りを記念したミッションイベント。期間内に全ミッションクリアで豪華報酬！',
    color: '#ec4899',
    rewards: ['レアメダル', 'スキルアップ素材', 'スペシャルチケット'],
    missions: [
      { title: 'バトルに30回勝利', condition: '30勝達成', reward: 'ゴールド 10,000' },
      { title: 'メダルを50枚集める', condition: 'メダル50枚入手', reward: 'メダルピース' },
      { title: 'ステージ 1-5 をクリア', condition: 'ボスに勝利', reward: 'スキルアップ素材' },
    ],
  },
  {
    id: 'event-campaign-anniversary',
    name: '周年記念キャンペーン',
    type: 'campaign',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-31'),
    overview: 'ゲーム周年記念を記念した大型キャンペーン。毎日ログインボーナスが豪華に！',
    color: '#f59e0b',
    rewards: ['ダイヤ 1,000個', 'レアメダル', 'サンシーキング', 'キャラクター選択チケット'],
  },
  {
    id: 'event-future-collab',
    name: 'コラボレーション「謎の侵略者」',
    type: 'campaign',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-08-15'),
    overview: '新作アニメとのコラボレーション。限定キャラクターが登場予定！',
    color: '#10b981',
    rewards: ['限定キャラクター', 'コラボメダル', 'コラボ限定スキン'],
  },
];

export function getCharacter(id?: string) {
  return characters.find((character) => character.id === id);
}

export function getMedal(id?: string) {
  return medals.find((medal) => medal.id === id);
}

export function getTag(id?: string) {
  return tags.find((tag) => tag.id === id);
}

export function getEvent(id?: string) {
  return events.find((event) => event.id === id);
}

export function getEventStatus(event: GameEvent): EventStatus {
  const now = new Date();
  if (now < event.startDate) return 'scheduled';
  if (now > event.endDate) return 'ended';
  return 'ongoing';
}
