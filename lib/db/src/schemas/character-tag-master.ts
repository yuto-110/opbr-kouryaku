import { Schema, model, type Document } from "mongoose";

export interface ICharacterTagMaster extends Document {
  id: string;
  name: string;
  description: string;
  supportEffect: string;
  supportCategory: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const characterTagMasterSchema = new Schema<ICharacterTagMaster>(
  {
    id: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },
    supportEffect: { type: String, default: "", trim: true },
    supportCategory: { type: String, default: "その他", trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

characterTagMasterSchema.index({ name: 1 });
characterTagMasterSchema.index({ active: 1, name: 1 });

export const CharacterTagMaster = model<ICharacterTagMaster>(
  "CharacterTagMaster",
  characterTagMasterSchema,
);
