import { Schema, model, type Document } from "mongoose";

export interface IChallengeRewardItem extends Document {
  id: string;
  name: string;
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
  passRewards: IChallengeBattleReward[];
}

export interface IChallengeBattle extends Document {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  overview: string;
  rules: string;
  scoreRewards: IChallengeBattleScoreReward[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const challengeRewardItemSchema = new Schema<IChallengeRewardItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
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
    passRewards: { type: [challengeBattleRewardSchema], default: [] },
  },
  { _id: false },
);

const challengeBattleSchema = new Schema<IChallengeBattle>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    overview: { type: String, trim: true, default: "" },
    rules: { type: String, trim: true, default: "" },
    scoreRewards: { type: [challengeBattleScoreRewardSchema], default: [] },
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
