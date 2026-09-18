import { z } from "zod";

/* ============================================================
 * Health
 * ============================================================ */

export const HealthCheckResponse = z.object({
  status: z.literal("ok"),
});

/* ============================================================
 * User
 * ============================================================ */

export const UserRoleSchema = z.enum([
  "admin",
  "user",
]);

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.literal("user").default("user"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserResponseSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string(),
  role: UserRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateUserInput = z.infer<
  typeof CreateUserSchema
>;

export type LoginInput = z.infer<
  typeof LoginSchema
>;

export type UserResponse = z.infer<
  typeof UserResponseSchema
>;

/* ============================================================
 * Character Basic
 * ============================================================ */

export const CharacterAttributeSchema = z.enum([
  "赤",
  "青",
  "緑",
  "黒",
  "白",
]);

export const CharacterRoleSchema = z.enum([
  "アタッカー",
  "ゲッター",
  "ディフェンダー",
]);

export const CharacterRaritySchema = z.enum([
  "超レジェンダリー",
  "レジェンダリー",
  "恒常",
  "配布",
  "コーラ",
]);

export const CharacterInitialStarsSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const CharacterTierSchema = z.enum([
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

export type CharacterAttribute = z.infer<
  typeof CharacterAttributeSchema
>;

export type CharacterRole = z.infer<
  typeof CharacterRoleSchema
>;

export type CharacterRarity = z.infer<
  typeof CharacterRaritySchema
>;

export type CharacterInitialStars = z.infer<
  typeof CharacterInitialStarsSchema
>;

export type CharacterTier = z.infer<
  typeof CharacterTierSchema
>;

/* ============================================================
 * Character Tags
 *
 * サポート編成・検索・絞り込みで利用するマスタータグ
 * ============================================================ */

export const CHARACTER_TAG_OPTIONS = [
  "攻撃力増加",
  "攻撃力減少",
  "防御力増加",
  "防御力減少",
  "防御力無視",
  "ダメージ減少無視",
  "回復",
  "無敵",
  "よろけ無効",
  "ふっとばし",
  "引き寄せ",
  "クールタイム短縮",
  "クールタイム増加",
  "回避性能強化",
  "通常攻撃強化",
  "スキル強化",
  "状態異常無効",
  "状態異常解除",
  "状態異常付与",
  "旗奪取",
  "旗防衛",
  "お宝ゲージ回復",
  "体力回復",
  "味方強化",
  "敵弱体化",
  "敵撃破時強化",
  "復活",
  "耐久型",
  "火力型",
  "サポート型",
] as const;

export const CharacterTagSchema = z.enum(
  CHARACTER_TAG_OPTIONS,
);

export const CharacterTagsSchema = z
  .array(CharacterTagSchema)
  .default([]);

/* ============================================================
 * Change Option
 * ============================================================ */

const ChangeOptionSchema = <
  T extends z.ZodTypeAny,
>(
  schema: T,
) =>
  z.object({
    base: schema,
    changesTo: z
      .array(schema)
      .default([]),
  });

export const CharacterAttributeChangeSchema =
  ChangeOptionSchema(
    CharacterAttributeSchema,
  );

export const CharacterRoleChangeSchema =
  ChangeOptionSchema(
    CharacterRoleSchema,
  );

/* ============================================================
 * Stats
 * ============================================================ */

export const StatValuesSchema = z.object({
  totalPower: z
    .number()
    .int()
    .min(0),

  hp: z
    .number()
    .int()
    .min(0),

  attack: z
    .number()
    .int()
    .min(0),

  defense: z
    .number()
    .int()
    .min(0),

  critical: z
    .number()
    .min(0),
});

export const LevelStatSchema =
  StatValuesSchema.extend({
    level: z
      .number()
      .int()
      .min(1)
      .max(100),
  });

export const CharacterStatsSchema = z.object({
  levelStats: z
    .array(LevelStatSchema)
    .default([]),

  level100Overboost:
    StatValuesSchema,
});

/* ============================================================
 * Skills
 * ============================================================ */

export const SKILL_TYPE_OPTIONS = [
  "通常",
  "ダブルキャラ",
  "スタイルチェンジ",
  "EVスキル",
  "コンボスキル",
  "奪取中カウンタースキル",
] as const;

export const SkillTypeSchema = z.enum(
  SKILL_TYPE_OPTIONS,
);

export const SKILL_EFFECT_TAG_OPTIONS = [
  "攻撃力増加",
  "攻撃力減少",
  "防御力増加",
  "防御力減少",
  "防御力無視",
  "ダメージ減少無視",
  "回復",
  "無敵",
  "よろけ無効",
  "ふっとばし",
  "引き寄せ",
  "クールタイム短縮",
  "クールタイム増加",
  "回避性能強化",
  "通常攻撃強化",
  "スキル強化",
  "状態異常無効",
  "状態異常解除",
  "旗奪取補助",
  "旗防衛補助",
  "お宝ゲージ回復",
  "体力回復",
  "味方強化",
  "敵弱体化",
  "敵撃破時強化",
  "復活",
] as const;

export const SkillEffectTagSchema =
  z.enum(
    SKILL_EFFECT_TAG_OPTIONS,
  );

export const STATUS_AILMENT_OPTIONS = [
  "気絶",
  "燃焼",
  "凍結",
  "感電",
  "毒",
  "魅了",
  "混乱",
  "石化",
  "振動",
  "お宝奪取不可",
  "回避不可",
  "スキル使用不可",
  "攻撃力減少",
  "防御力減少",
  "移動速度減少",
] as const;

export const StatusAilmentSchema =
  z.enum(
    STATUS_AILMENT_OPTIONS,
  );

export const SkillSchema = z.object({
  skillType:
    SkillTypeSchema.default("通常"),

  name: z
    .string()
    .min(1)
    .max(200),

  description: z
    .string()
    .min(1)
    .max(5000),

  power: z
    .number()
    .min(0)
    .optional(),

  cooldown: z
    .number()
    .min(0)
    .optional(),

  /*
   * 旧データ互換
   */
  damageReductionIgnore: z
    .boolean()
    .default(false),

  defenseIgnore: z
    .boolean()
    .default(false),

  /*
   * 新しい複数タグ
   */
  effectTags: z
    .array(SkillEffectTagSchema)
    .default([]),

  statusAilment: z
    .string()
    .max(200)
    .optional(),

  /*
   * 新しい複数状態異常タグ
   */
  statusAilments: z
    .array(StatusAilmentSchema)
    .default([]),

  duration: z
    .number()
    .min(0)
    .optional(),

  extraEffects: z
    .array(
      z.string().max(2000),
    )
    .default([]),

  changeFromSkillIndex: z
    .number()
    .int()
    .min(0)
    .optional(),

  changeCondition: z
    .enum(["一定時間", "コンボ成立時", "奪取中", "条件達成時"])
    .optional(),

  changeDuration: z
    .number()
    .min(0)
    .optional(),
});

export const SkillsSchema = z
  .array(SkillSchema)
  .default([]);

/* ============================================================
 * Traits
 * ============================================================ */

export const TraitSlotSchema = z.enum([
  "キャラ特性",
  "スタイル特性",
  "特性1",
  "特性2",
  "ブースト特性",
  "その他",
]);

export const TraitSchema = z.object({
  slot: TraitSlotSchema,
  target: z.string().max(200).default("共通"),
  traitName: z.string().max(200).default(""),
  name: z.string().max(200).default(""),
  effect: z.string().min(1).max(5000),
});

export const TraitsSchema = z
  .array(TraitSchema)
  .default([]);

/* ============================================================
 * Character Type
 * ============================================================ */

export const CharacterTypeSchema =
  z.object({
    typeId: z
      .string()
      .min(1)
      .max(100),

    name: z
      .string()
      .min(1)
      .max(200),

    effect: z
      .string()
      .min(1)
      .max(5000),
  });

export const CharacterTypesSchema = z
  .array(CharacterTypeSchema)
  .default([]);

/* ============================================================
 * Team Boost
 * ============================================================ */

export const TeamBoostSchema =
  z.object({
    boostId: z
      .string()
      .min(1)
      .max(100),

    name: z
      .string()
      .min(1)
      .max(200),

    effect: z
      .string()
      .min(1)
      .max(5000),

    iconUrl: z
      .string()
      .url()
      .optional(),
  });

/* ============================================================
 * Common
 * ============================================================ */

const CharacterIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9-]+$/,
    "IDは半角小文字英数字とハイフンのみ使用できます",
  );

/* ============================================================
 * Create Character
 *
 * 新規登録時のIDはAPI側で自動生成する。
 * ============================================================ */

export const CreateCharacterSchema =
  z.object({
    id:
      CharacterIdSchema.optional(),

    name: z
      .string()
      .trim()
      .min(1)
      .max(100),

    reading: z
      .string()
      .trim()
      .max(200)
      .default(""),

    faction: z
      .string()
      .trim()
      .max(200)
      .default(""),

    description: z
      .string()
      .max(10000)
      .default(""),

    tags:
      CharacterTagsSchema,

    /*
     * 管理画面では入力しない。
     * 既存APIとの互換性のためschemaには残す。
     */
    implementedAt:
      z.coerce.date().optional(),

    attribute:
      CharacterAttributeChangeSchema,

    role:
      CharacterRoleChangeSchema,

    rarity:
      CharacterRaritySchema,

    initialStars:
      CharacterInitialStarsSchema,

    stats:
      CharacterStatsSchema,

    skills:
      SkillsSchema,

    traits:
      TraitsSchema,

    characterTypes:
      CharacterTypesSchema,

    teamBoost:
      TeamBoostSchema.optional(),

    tier:
      CharacterTierSchema,

    imageUrl:
      z
        .string()
        .url()
        .optional(),

    strengths:
      z
        .array(
          z.string().max(500),
        )
        .default([]),

    weaknesses:
      z
        .array(
          z.string().max(500),
        )
        .default([]),

    recommendedMedals:
      z
        .array(
          z.string().max(200),
        )
        .default([]),

    relatedCharacters:
      z
        .array(
          z.string().max(100),
        )
        .default([]),
  });

/* ============================================================
 * Update Character
 * ============================================================ */

export const UpdateCharacterSchema =
  CreateCharacterSchema
    .omit({
      id: true,
    })
    .partial();

/* ============================================================
 * Character Response
 * ============================================================ */

export const CharacterResponseSchema =
  z.object({
    _id: z.string(),

    id: z.string(),

    name: z.string(),

    reading:
      z.string().optional(),

    faction:
      z.string().optional(),

    description:
      z.string().optional(),

    tags:
      z.array(z.string()),

    implementedAt:
      z.date().optional(),

    attribute:
      CharacterAttributeChangeSchema,

    role:
      CharacterRoleChangeSchema,

    rarity:
      CharacterRaritySchema,

    initialStars:
      CharacterInitialStarsSchema,

    stats:
      CharacterStatsSchema,

    skills:
      z.array(SkillSchema),

    traits:
      z.array(TraitSchema),

    characterTypes:
      z.array(CharacterTypeSchema),

    teamBoost:
      TeamBoostSchema.optional(),

    tier:
      CharacterTierSchema,

    imageUrl:
      z.string().optional(),

    strengths:
      z.array(z.string()),

    weaknesses:
      z.array(z.string()),

    recommendedMedals:
      z.array(z.string()),

    relatedCharacters:
      z.array(z.string()),

    createdAt:
      z.date(),

    updatedAt:
      z.date(),
  });

export type CreateCharacterInput =
  z.infer<
    typeof CreateCharacterSchema
  >;

export type UpdateCharacterInput =
  z.infer<
    typeof UpdateCharacterSchema
  >;

export type CharacterResponse =
  z.infer<
    typeof CharacterResponseSchema
  >;

/* ============================================================
 * Team Boost Master
 * ============================================================ */

export const TeamBoostMasterSchema =
  z.object({
    boostId: z
      .string()
      .trim()
      .min(1)
      .max(100),

    name: z
      .string()
      .trim()
      .min(1)
      .max(200),

    effect: z
      .string()
      .trim()
      .min(1)
      .max(5000),

    order: z
      .number()
      .int()
      .default(0),

    active: z
      .boolean()
      .default(true),
  });

export type TeamBoostMaster =
  z.infer<
    typeof TeamBoostMasterSchema
  >;

/* ============================================================
 * Character Type Master
 * ============================================================ */

export const CharacterTypeMasterSchema =
  z.object({
    typeId: z
      .string()
      .trim()
      .min(1)
      .max(100),

    name: z
      .string()
      .trim()
      .min(1)
      .max(200),

    effect: z
      .string()
      .trim()
      .min(1)
      .max(5000),

    order: z
      .number()
      .int()
      .default(0),

    active: z
      .boolean()
      .default(true),
  });

export type CharacterTypeMaster =
  z.infer<
    typeof CharacterTypeMasterSchema
  >;