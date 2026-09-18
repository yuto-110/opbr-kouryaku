import { Schema, model, type Document } from "mongoose";
import { z } from "zod";

export const CharacterAttributeEnum = z.enum([
  "赤",
  "青",
  "緑",
  "黒",
  "白",
]);

export const CharacterRoleEnum = z.enum([
  "アタッカー",
  "ゲッター",
  "ディフェンダー",
]);

export const CharacterRarityEnum = z.enum([
  "超レジェンダリー",
  "レジェンダリー",
  "恒常",
  "配布",
  "コーラ",
]);

export const CharacterInitialStarsEnum = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const CharacterTierEnum = z.enum([
  "SS",
  "S+",
  "S",
  "A+",
  "A",
  "B+",
  "B",
  "圏外",
  "評価中",
]);

export type CharacterAttribute = z.infer<typeof CharacterAttributeEnum>;
export type CharacterRole = z.infer<typeof CharacterRoleEnum>;
export type CharacterRarity = z.infer<typeof CharacterRarityEnum>;
export type CharacterInitialStars = z.infer<typeof CharacterInitialStarsEnum>;
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
  levelStats: ILevelStat[];
  level100Overboost: IStatValues;
}

export interface IChangeOption<T> {
  base: T;
  changesTo: T[];
}

export interface ISkillStageDetail {
  label: string;
  value: string;
}

export interface ISkillStage {
  label?: string;
  power?: number;
  cooldown?: number;
  effect?: string;
  effects?: string[];
  details?: ISkillStageDetail[];
}

export interface ISkill {
  skillSlot?: "スキル1" | "スキル2" | "その他";
  targetCharacter?: string;
  variantOrder?: number;
  imageUrl?: string;
  stages?: ISkillStage[];
  skillType?: "通常" | "ダブルキャラ" | "スタイルチェンジ" | "EVスキル" | "コンボスキル" | "奪取中カウンタースキル";
  name: string;
  skillInfo: string;
  description: string;
  power?: number;
  cooldown?: number;
  damageReductionIgnore?: boolean;
  defenseIgnore?: boolean;
  effectTags: string[];
  statusAilment?: string;
  statusAilments: string[];
  duration?: number;
  extraEffects: string[];
  changeFromSkillIndex?: number;
  changeCondition?: "一定時間" | "コンボ成立時" | "奪取中" | "条件達成時";
  changeDuration?: number;
}

export interface ITrait {
  slot: "キャラ特性" | "スタイル特性" | "特性1" | "特性2" | "ブースト特性" | "その他";
  target: string;
  traitName: string;
  name: string;
  effect: string;
  effects?: string[];
}

export interface ICharacterType {
  typeId: string;
  name: string;
  effect: string;
}

export interface ITeamBoost {
  boostId: string;
  name: string;
  effect: string;
  iconUrl?: string;
}

export interface ICharacter extends Document {
  id: string;
  name: string;
  reading?: string;
  faction?: string;
  description?: string;
  tags: string[];
  doubleCharacters: string[];

  attribute: IChangeOption<CharacterAttribute>;
  role: IChangeOption<CharacterRole>;

  rarity: CharacterRarity;
  initialStars: CharacterInitialStars;

  stats: ICharacterStats;
  skills: ISkill[];
  traits: ITrait[];
  characterTypes: ICharacterType[];
  teamBoost?: ITeamBoost;

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
    totalPower: { type: Number, required: true, min: 0 },
    hp: { type: Number, required: true, min: 0 },
    attack: { type: Number, required: true, min: 0 },
    defense: { type: Number, required: true, min: 0 },
    critical: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const levelStatSchema = new Schema<ILevelStat>(
  {
    level: { type: Number, required: true, min: 1, max: 100 },
    totalPower: { type: Number, required: true, min: 0 },
    hp: { type: Number, required: true, min: 0 },
    attack: { type: Number, required: true, min: 0 },
    defense: { type: Number, required: true, min: 0 },
    critical: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const characterStatsSchema = new Schema<ICharacterStats>(
  {
    levelStats: { type: [levelStatSchema], default: [] },
    level100Overboost: { type: statValuesSchema, required: true },
  },
  { _id: false },
);

const skillStageDetailSchema = new Schema<ISkillStageDetail>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const skillStageSchema = new Schema<ISkillStage>(
  {
    label: { type: String },
    power: { type: Number, min: 0 },
    cooldown: { type: Number, min: 0 },
    effect: { type: String },
    effects: { type: [String], default: [] },
    details: { type: [skillStageDetailSchema], default: [] },
  },
  { _id: false },
);

const skillSchema = new Schema<ISkill>(
  {
    skillSlot: { type: String, enum: ["スキル1", "スキル2", "その他"], default: "その他" },
    targetCharacter: { type: String, default: "共通" },
    variantOrder: { type: Number, min: 0, default: 0 },
    imageUrl: { type: String },
    stages: { type: [skillStageSchema], default: [] },
    name: { type: String, required: true },
    skillInfo: { type: String, default: "" },
    description: { type: String, required: true },
    power: { type: Number, min: 0 },
    cooldown: { type: Number, min: 0 },
    damageReductionIgnore: { type: Boolean, default: false },
    defenseIgnore: { type: Boolean, default: false },
    statusAilment: { type: String },
    duration: { type: Number, min: 0 },
    extraEffects: { type: [String], default: [] },
    skillType: {
      type: String,
      enum: ["通常", "ダブルキャラ", "スタイルチェンジ", "EVスキル", "コンボスキル", "奪取中カウンタースキル"],
      default: "通常",
    },
    effectTags: { type: [String], default: [] },
    statusAilments: { type: [String], default: [] },
    changeFromSkillIndex: { type: Number, min: 0 },
    changeCondition: {
      type: String,
      enum: ["一定時間", "コンボ成立時", "奪取中", "条件達成時"],
    },
    changeDuration: { type: Number, min: 0 },
  },
  { _id: false },
);

const traitSchema = new Schema<ITrait>(
  {
    slot: {
      type: String,
      enum: ["キャラ特性", "スタイル特性", "特性1", "特性2", "ブースト特性", "その他"],
      required: true,
    },
    target: { type: String, required: true, default: "共通" },
    traitName: { type: String, required: true, default: "" },
    name: { type: String, required: true },
    effect: { type: String, default: "" },
    effects: { type: [String], default: [] },
  },
  { _id: false },
);

const characterTypeSchema = new Schema<ICharacterType>(
  {
    typeId: { type: String, required: true },
    name: { type: String, required: true },
    effect: { type: String, required: true },
  },
  { _id: false },
);

const teamBoostSchema = new Schema<ITeamBoost>(
  {
    boostId: { type: String, required: true },
    name: { type: String, required: true },
    effect: { type: String, required: true },
    iconUrl: { type: String },
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
    name: { type: String, required: true, trim: true },
    reading: { type: String, trim: true, default: "" },
    faction: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    doubleCharacters: { type: [String], default: [] },

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
      enum: [2, 3, 4],
      required: true,
    },
    stats: { type: characterStatsSchema, required: true },
    skills: { type: [skillSchema], default: [] },
    traits: { type: [traitSchema], default: [] },
    characterTypes: { type: [characterTypeSchema], default: [] },
    teamBoost: { type: teamBoostSchema, required: false },
    tier: {
      type: String,
      enum: CharacterTierEnum.options,
      required: true,
    },
    imageUrl: { type: String },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendedMedals: { type: [String], default: [] },
    relatedCharacters: { type: [String], default: [] },
    implementedAt: { type: Date },
  },
  { timestamps: true },
);

characterSchema.index({ name: 1 });
characterSchema.index({ "attribute.base": 1 });
characterSchema.index({ "role.base": 1 });
characterSchema.index({ rarity: 1 });
characterSchema.index({ tier: 1 });
characterSchema.index({ "characterTypes.typeId": 1 });
characterSchema.index({ "teamBoost.boostId": 1 });

export const Character = model<ICharacter>("Character", characterSchema);
