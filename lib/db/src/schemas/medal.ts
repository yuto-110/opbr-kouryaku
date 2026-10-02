import { Schema, model, models, type Document } from "mongoose";

export interface IMedalAdditionalLottery {
  star: 1 | 2 | 3;
  effect: string;
  probability: string;
}

export interface IMedal extends Document {
  id: string;
  name: string;
  imageUrl?: string;
  uniqueTrait: string;
  additionalTrait1: string;
  additionalTrait2: string;
  additionalTrait3: string;
  medalTagIds: string[];
  tagEffect: string;
  additionalLotteries: IMedalAdditionalLottery[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lotterySchema = new Schema<IMedalAdditionalLottery>(
  {
    star: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    effect: {
      type: String,
      required: true,
      trim: true,
    },
    probability: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const medalSchema = new Schema<IMedal>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    uniqueTrait: {
      type: String,
      trim: true,
      default: "",
    },
    additionalTrait1: {
      type: String,
      trim: true,
      default: "",
    },
    additionalTrait2: {
      type: String,
      trim: true,
      default: "",
    },
    additionalTrait3: {
      type: String,
      trim: true,
      default: "",
    },
    medalTagIds: {
      type: [String],
      default: [],
      index: true,
    },
    tagEffect: {
      type: String,
      trim: true,
      default: "",
    },
    additionalLotteries: {
      type: [lotterySchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

medalSchema.index({ name: 1 });
medalSchema.index({ medalTagIds: 1 });

export const Medal =
  models.Medal || model<IMedal>("Medal", medalSchema);
