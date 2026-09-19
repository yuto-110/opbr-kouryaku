import { Schema, model, type Document } from "mongoose";

export interface ICharacterIconMaster extends Document {
  id: string;
  name: string;
  imageUrl: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICharacterIconMaster>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, unique: true },
    imageUrl: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

schema.index({ active: 1, name: 1 });

export const CharacterIconMaster = model<ICharacterIconMaster>(
  "CharacterIconMaster",
  schema,
);
