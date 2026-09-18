import { Schema, model, models } from "mongoose";

const CharacterTagLevelSchema = new Schema(
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
      default: 0,
    },
    effect: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const CharacterTagMasterSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    supportCategory: {
      type: String,
      trim: true,
      default: "その他",
    },

    supportEffect: {
      type: String,
      trim: true,
      default: "",
    },

    levels: {
      type: [CharacterTagLevelSchema],
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
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CharacterTagMaster =
  models.CharacterTagMaster ||
  model("CharacterTagMaster", CharacterTagMasterSchema);
