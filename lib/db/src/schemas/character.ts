import { Schema, model, type Document } from 'mongoose';
import { z } from 'zod';

export const CharacterAttributeEnum = z.enum([
  '赤',
  '青',
  '緑',
  '黒',
  '白',
]);

export const CharacterRoleEnum = z.enum([
  'アタッカー',
  'ゲッター',
  'ディフェンダー',
]);

export const CharacterRarityEnum = z.enum([
  'レジェンダリー',
  '超レジェンダリー',
  '恒常',
]);

export const CharacterInitialStarsEnum = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const CharacterTierEnum = z.enum([
  'SS',
  'S+',
  'S',
  'A+',
  'A',
  'B+',
  'B',
]);

export type CharacterAttribute = z.infer<typeof CharacterAttributeEnum>;
export type CharacterRole = z.infer<typeof CharacterRoleEnum>;
export type CharacterRarity = z.infer<typeof CharacterRarityEnum>;
export type CharacterInitialStars = z.infer<
  typeof CharacterInitialStarsEnum
>;
export type CharacterTier = z.infer<typeof CharacterTierEnum>;

export interface IStatValues {
  totalPower: number;
  hp: number;
  attack: number;
  defense: number;
  critical: number;
}

export interface ILevelStat extends IStatValues {
  level: number;
}

export interface ICharacterStats {
  // 実測できたLvごとのステータス
  levelStats: ILevelStat[];

  // Lv100 + オーバーブースト時の最大ステータス
  level100Overboost: IStatValues;
}

export interface IChangeOption<T> {
  base: T;
  changesTo: T[];
}

export interface ISkill {
  name: string;
  description: string;
  cooldown?: number;
}

export interface ITrait {
  name: string;
  effect: string;
}

export interface ICharacterType {
  typeId: string;
  name: string;
  effect?: string;
  effectLevel?: number;
}

export interface ICharacter extends Document {
  id: string;

  name: string;
  reading: string;

  // キャラクターが最初に持っている属性
  // 変化する場合は changesTo に記録
  attribute: IChangeOption<CharacterAttribute>;

  // キャラクターが最初に持っているスタイル
  // 戦闘中に変化する場合は changesTo に記録
  role: IChangeOption<CharacterRole>;

  rarity: CharacterRarity;

  // 初期状態の★
  initialStars: CharacterInitialStars;

  stats: ICharacterStats;

  description: string;

  skills: ISkill[];
  traits: ITrait[];

  // 新世界、海軍などのキャラクタータイプ
  characterTypes: ICharacterType[];

  // チームブースト
  teamBoost?: string;

  tier: CharacterTier;

  imageUrl?: string;

  strengths: string[];
  weaknesses: string[];

  recommendedMedals: string[];
  relatedCharacters: string[];

  implementedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const statValuesSchema = new Schema<IStatValues>(
  {
    totalPower: {
      type: Number,
      required: true,
    },
    hp: {
      type: Number,
      required: true,
    },
    attack: {
      type: Number,
      required: true,
    },
    defense: {
      type: Number,
      required: true,
    },
    critical: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const levelStatSchema = new Schema<ILevelStat>(
  {
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    totalPower: {
      type: Number,
      required: true,
    },
    hp: {
      type: Number,
      required: true,
    },
    attack: {
      type: Number,
      required: true,
    },
    defense: {
      type: Number,
      required: true,
    },
    critical: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const characterStatsSchema = new Schema<ICharacterStats>(
  {
    levelStats: {
      type: [levelStatSchema],
      default: [],
      validate: {
        validator: (values: ILevelStat[]) =>
          values.every(
            (value) =>
              Number.isInteger(value.level) &&
              value.level >= 1 &&
              value.level <= 100,
          ),
        message:
          'levelStats.level must be an integer from 1 to 100',
      },
    },

    level100Overboost: {
      type: statValuesSchema,
      required: true,
    },
  },
  { _id: false },
);

const skillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    cooldown: Number,
  },
  { _id: false },
);

const traitSchema = new Schema<ITrait>(
  {
    name: {
      type: String,
      required: true,
    },
    effect: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const characterTypeSchema = new Schema<ICharacterType>(
  {
    typeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    effect: String,
    effectLevel: Number,
  },
  { _id: false },
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

    attribute: {
      base: {
        type: String,
        enum: CharacterAttributeEnum.options,
        required: true,
      },

      changesTo: {
        type: [String],
        enum: CharacterAttributeEnum.options,
        default: [],
      },
    },

    role: {
      base: {
        type: String,
        enum: CharacterRoleEnum.options,
        required: true,
      },

      changesTo: {
        type: [String],
        enum: CharacterRoleEnum.options,
        default: [],
      },
    },

    rarity: {
      type: String,
      enum: CharacterRarityEnum.options,
      required: true,
    },

    initialStars: {
      type: Number,
      enum: CharacterInitialStarsEnum.options,
      required: true,
    },

    stats: {
      type: characterStatsSchema,
      required: true,
    },

    description: String,

    skills: {
      type: [skillSchema],
      default: [],
    },

    traits: {
      type: [traitSchema],
      default: [],
    },

    characterTypes: {
      type: [characterTypeSchema],
      default: [],
    },

    teamBoost: String,

    tier: {
      type: String,
      enum: CharacterTierEnum.options,
      required: true,
    },

    imageUrl: String,

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    recommendedMedals: {
      type: [String],
      default: [],
    },

    relatedCharacters: {
      type: [String],
      default: [],
    },

    implementedAt: Date,
  },
  {
    timestamps: true,
  },
);

characterSchema.index({ id: 1 }, { unique: true });
characterSchema.index({ name: 1 });
characterSchema.index({ 'attribute.base': 1 });
characterSchema.index({ 'role.base': 1 });
characterSchema.index({ rarity: 1 });
characterSchema.index({ tier: 1 });
characterSchema.index({ 'characterTypes.typeId': 1 });
characterSchema.index({ teamBoost: 1 });

export const Character = model<ICharacter>(
  'Character',
  characterSchema,
);
