import { Schema, model, type Document } from "mongoose";

// 共通アイテムの種類（例: normal / event / medal-material / title / background / medal-inheritance）。
// 有効な値は API 側のカテゴリ定義（api-server/src/lib/reward-items.ts）で検証する。
// メダル本体は Medal コレクションを正とするため、ここには保存しない。
export type RewardItemStoredCategory = string;

export interface IChallengeRewardItem extends Document {
  id: string;
  name: string;
  // 既存データには無い。未設定は "normal" として扱う（データ移行は不要）
  category?: RewardItemStoredCategory;
  imageUrl: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChallengeBattleReward {
  itemId: string;
  quantity: number;
}


export interface IChallengeBattleScoreReward {
  score: number;
  normalRewards: IChallengeBattleReward[];
  passLiteRewards: IChallengeBattleReward[];
  passPremiumRewards: IChallengeBattleReward[];

  // 既存データとの互換性を保つために残す
  passRewards?: IChallengeBattleReward[];
}

export interface IChallengeBattleRankingReward {
  rankFrom: number;
  rankTo: number;
  rewards: IChallengeBattleReward[];
}

export interface IChallengeBattle extends Document {
  id: string;
  name: string;
  bannerImageUrl: string;
  startDate: Date;
  endDate: Date;
  overview: string;
  rules: string;
  scoreRewards: IChallengeBattleScoreReward[];
  rankingRewards: IChallengeBattleRankingReward[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}


const challengeRewardItemSchema = new Schema<IChallengeRewardItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "normal" },
    imageUrl: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

challengeRewardItemSchema.index({ active: 1, name: 1 });

const challengeBattleRewardSchema = new Schema<IChallengeBattleReward>(
  {
    itemId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const challengeBattleScoreRewardSchema = new Schema<IChallengeBattleScoreReward>(
  {
    score: { type: Number, required: true, min: 0 },
    normalRewards: { type: [challengeBattleRewardSchema], default: [] },
    passLiteRewards: { type: [challengeBattleRewardSchema], default: [] },
    passPremiumRewards: { type: [challengeBattleRewardSchema], default: [] },
    // 旧データの読み取り用。API側で passLiteRewards に正規化する。
    passRewards: { type: [challengeBattleRewardSchema], default: undefined },
  },
  { _id: false },
);

const challengeBattleRankingRewardSchema = new Schema<IChallengeBattleRankingReward>(
  {
    rankFrom: { type: Number, min: 1, required: true },
    rankTo: { type: Number, min: 1, required: true },
    rewards: { type: [challengeBattleRewardSchema], default: [] },
  },
  { _id: false },
);

const challengeBattleSchema = new Schema<IChallengeBattle>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    bannerImageUrl: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    overview: { type: String, trim: true, default: "" },
    rules: { type: String, trim: true, default: "" },
    scoreRewards: { type: [challengeBattleScoreRewardSchema], default: [] },
    rankingRewards: { type: [challengeBattleRankingRewardSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

challengeBattleSchema.index({ startDate: -1, endDate: -1 });
challengeBattleSchema.index({ active: 1, startDate: -1 });

export const ChallengeRewardItem = model<IChallengeRewardItem>(
  "ChallengeRewardItem",
  challengeRewardItemSchema,
);

export const ChallengeBattle = model<IChallengeBattle>(
  "ChallengeBattle",
  challengeBattleSchema,
);
