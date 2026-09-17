import { Schema, model, type Document } from 'mongoose';

export interface ICharacterGrowthRule extends Document {
  stars: number;
  maxLevel: number;
  upgradeCostToNext?: number;
}

export interface ICharacterUnlockRule extends Document {
  initialStars: number;
  unlockFragments: number;
}

const characterGrowthRuleSchema =
  new Schema<ICharacterGrowthRule>(
    {
      stars: {
        type: Number,
        required: true,
        unique: true,
        min: 2,
        max: 6,
      },

      maxLevel: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
      },

      upgradeCostToNext: {
        type: Number,
        min: 0,
      },
    },
    {
      timestamps: true,
    },
  );

const characterUnlockRuleSchema =
  new Schema<ICharacterUnlockRule>(
    {
      initialStars: {
        type: Number,
        required: true,
        unique: true,
        min: 2,
        max: 4,
      },

      unlockFragments: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      timestamps: true,
    },
  );

export const CharacterGrowthRule =
  model<ICharacterGrowthRule>(
    'CharacterGrowthRule',
    characterGrowthRuleSchema,
  );

export const CharacterUnlockRule =
  model<ICharacterUnlockRule>(
    'CharacterUnlockRule',
    characterUnlockRuleSchema,
  );
