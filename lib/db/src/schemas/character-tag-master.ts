import { Schema, model, type Document } from "mongoose";

export interface ICharacterTagLevel {
  level: number;
  totalLevel: number;
  effect: string;
}

export interface ICharacterTagMaster extends Document {
  id: string;
  name: string;
  supportEffect: string;
  supportCategory: string;
  levels: ICharacterTagLevel[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const characterTagLevelSchema = new Schema<ICharacterTagLevel>(
  {
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    totalLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 600,
    },
    effect: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const characterTagMasterSchema = new Schema<ICharacterTagMaster>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    supportEffect: {
      type: String,
      default: "",
      trim: true,
    },

    supportCategory: {
      type: String,
      default: "その他",
      trim: true,
    },

    levels: {
      type: [characterTagLevelSchema],
      default: () =>
        Array.from({ length: 5 }, (_, index) => ({
          level: index + 1,
          totalLevel: 0,
          effect: "",
        })),
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

characterTagMasterSchema.index({ name: 1 });
characterTagMasterSchema.index({ active: 1, name: 1 });

export const CharacterTagMaster = model<ICharacterTagMaster>(
  "CharacterTagMaster",
  characterTagMasterSchema,
);
