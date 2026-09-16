import { Schema, model, type Document } from 'mongoose';
import { z } from 'zod';

export const CharacterRarityEnum = z.enum(['伝説', '超激レア', '激レア', 'レア']);
export const CharacterRoleEnum = z.enum(['アタッカー', 'ディフェンダー', 'サポート', 'コントロール']);

export type CharacterRarity = z.infer<typeof CharacterRarityEnum>;
export type CharacterRole = z.infer<typeof CharacterRoleEnum>;

export interface IStat {
  label: string;
  value: number;
}

export interface ISkill {
  name: string;
  description: string;
  cooldown: number;
}

export interface ITrait {
  name: string;
  effect: string;
}

export interface ICharacter extends Document {
  id: string; // Unique character ID (different from MongoDB _id)
  name: string;
  reading: string;
  faction: string;
  role: CharacterRole;
  rarity: CharacterRarity;
  element: string;
  color: string;
  stats: IStat[];
  description: string;
  skills: ISkill[];
  traits: ITrait[];
  tags: string[];
  tier: string;
  imageUrl?: string;
  strengths: string[];
  weaknesses: string[];
  recommendedMedals: string[];
  relatedCharacters: string[];
  implementedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const statSchema = new Schema<IStat>(
  {
    label: String,
    value: Number,
  },
  { _id: false }
);

const skillSchema = new Schema<ISkill>(
  {
    name: String,
    description: String,
    cooldown: Number,
  },
  { _id: false }
);

const traitSchema = new Schema<ITrait>(
  {
    name: String,
    effect: String,
  },
  { _id: false }
);

const characterSchema = new Schema<ICharacter>(
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
    },
    reading: {
      type: String,
      required: true,
    },
    faction: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['アタッカー', 'ディフェンダー', 'サポート', 'コントロール'],
      required: true,
    },
    rarity: {
      type: String,
      enum: ['伝説', '超激レア', '激レア', 'レア'],
      required: true,
    },
    element: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    stats: [statSchema],
    description: String,
    skills: [skillSchema],
    traits: [traitSchema],
    tags: [String],
    tier: String,
    imageUrl: String,
    strengths: [String],
    weaknesses: [String],
    recommendedMedals: [String],
    relatedCharacters: [String],
    implementedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
characterSchema.index({ id: 1 });
characterSchema.index({ name: 1 });
characterSchema.index({ role: 1 });
characterSchema.index({ rarity: 1 });
characterSchema.index({ tags: 1 });

export const Character = model<ICharacter>('Character', characterSchema);
