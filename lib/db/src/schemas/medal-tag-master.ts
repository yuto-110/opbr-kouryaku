import { Schema, model, models, type Document } from "mongoose";

export interface IMedalTagMaster extends Document {
  id: string;
  name: string;
  twoSetEffect: string;
  threeSetEffect: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medalTagMasterSchema = new Schema<IMedalTagMaster>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    twoSetEffect: {
      type: String,
      trim: true,
      default: "",
    },
    threeSetEffect: {
      type: String,
      trim: true,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

medalTagMasterSchema.index({ name: 1 });

export const MedalTagMaster =
  models.MedalTagMaster ||
  model<IMedalTagMaster>("MedalTagMaster", medalTagMasterSchema);
