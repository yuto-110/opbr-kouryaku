import { Schema, model, type Document } from "mongoose";

export interface IMissionReward {
  itemId: string; // 共通アイテム(ChallengeRewardItem / Medal)の id
  quantity: number;
}

export interface IMissionEntry {
  id: string;
  name: string;
  condition: string;
  requiredCount: number;
  // ミッション個別の期限。イベント全体の終了日時とは別。未設定は null
  deadline: Date | null;
  rewards: IMissionReward[];
  sortOrder: number;
  published: boolean;
}

export interface IMissionEvent extends Document {
  id: string;
  name: string;
  eventCategory: string;
  description: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  published: boolean;
  sortOrder: number;
  missions: IMissionEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const missionRewardSchema = new Schema<IMissionReward>(
  {
    itemId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const missionEntrySchema = new Schema<IMissionEntry>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    condition: { type: String, trim: true, default: "" },
    requiredCount: { type: Number, required: true, min: 1, default: 1 },
    deadline: { type: Date, default: null },
    rewards: { type: [missionRewardSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { _id: false },
);

const missionEventSchema = new Schema<IMissionEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    eventCategory: { type: String, trim: true, default: "ミッション" },
    description: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    published: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    missions: { type: [missionEntrySchema], default: [] },
  },
  { timestamps: true },
);

missionEventSchema.index({ published: 1, sortOrder: 1, startDate: -1 });

// 既存の /events（モックデータ）とは別の、DB管理のイベントミッション
export const MissionEvent = model<IMissionEvent>("MissionEvent", missionEventSchema);
