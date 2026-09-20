import { Schema, model, type Document } from "mongoose";

export interface IMedalAdditionalTrait {
  content: string;
  drawRate: string;
  unlockCondition: string;
}

export interface IMedal extends Document {
  id: string;
  name: string;
  imageUrl: string;
  uniqueTrait: string;
  medalTags: string[];
  additionalTraits: [IMedalAdditionalTrait, IMedalAdditionalTrait, IMedalAdditionalTrait];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedalTagMaster extends Document {
  id: string;
  name: string;
  effect: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const additionalTraitSchema = new Schema<IMedalAdditionalTrait>(
  {
    content: { type: String, trim: true, default: "" },
    drawRate: { type: String, trim: true, default: "" },
    unlockCondition: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const medalSchema = new Schema<IMedal>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: "" },
    uniqueTrait: { type: String, trim: true, default: "" },
    medalTags: { type: [String], default: [] },
    additionalTraits: {
      type: [additionalTraitSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length === 3,
        message: "追加特性は3枠必要です",
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medalSchema.index({ name: 1 });
medalSchema.index({ active: 1, name: 1 });

const medalTagMasterSchema = new Schema<IMedalTagMaster>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, unique: true },
    effect: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medalTagMasterSchema.index({ active: 1, name: 1 });

export const Medal = model<IMedal>("Medal", medalSchema);
export const MedalTagMaster = model<IMedalTagMaster>(
  "MedalTagMaster",
  medalTagMasterSchema,
);
