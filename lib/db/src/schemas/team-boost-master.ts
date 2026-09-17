import { Schema, model, models, type Document } from 'mongoose';

export interface ITeamBoostMaster extends Document {
  boostId: string;
  name: string;
  effect: string;
  iconUrl?: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamBoostMasterSchema = new Schema<ITeamBoostMaster>(
  {
    boostId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    effect: {
      type: String,
      required: true,
      trim: true,
    },

    iconUrl: {
      type: String,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
      default: 0,
    },

    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

TeamBoostMasterSchema.index({ active: 1, order: 1 });

export const TeamBoostMaster =
  models.TeamBoostMaster ||
  model<ITeamBoostMaster>('TeamBoostMaster', TeamBoostMasterSchema);