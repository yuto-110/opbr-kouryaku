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

  // 通常のアカウント作成ではAPI側で user に固定する。
  // 管理者権限をクライアントから付与できないようにする。
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
 * Character - Basic
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
 * Change Option
 *
 * 属性・役職などが途中で変化するキャラクター用
 * ============================================================ */

const ChangeOptionSchema = <T extends z.ZodTypeAny>(
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
  /*
   * Lv1〜Lv100の各レベルのステータス
   *
   * 例:
   * [
   *   {
   *     level: 1,
   *     totalPower: 1000,
   *     hp: 1000,
   *     attack: 500,
   *     defense: 500,
   *     critical: 11
   *   }
   * ]
   */
  levelStats: z
    .array(LevelStatSchema)
    .default([]),

  /*
   * Lv100 + 超過ブースト時のステータス
   */
  level100Overboost:
    StatValuesSchema.optional(),
});

/* ============================================================
 * Skills
 * ============================================================ */

export const SkillSchema = z.object({
  /*
   * スキル名
   */
  name: z
    .string()
    .min(1)
    .max(200),

  /*
   * スキルの効果説明
   */
  description: z
    .string()
    .min(1)
    .max(5000),

  /*
   * 威力（%）
   *
   * 例:
   * 150
   * 300
   * 500
   */
  power: z
    .number()
    .min(0)
    .optional(),

  /*
   * クールタイム（秒）
   */
  cooldown: z
    .number()
    .min(0)
    .optional(),

  /*
   * ダメージ減少無視
   */
  damageReductionIgnore: z
    .boolean()
    .default(false),

  /*
   * 防御力無視
   */
  defenseIgnore: z
    .boolean()
    .default(false),

  /*
   * 状態異常
   *
   * 例:
   * 気絶
   * 燃焼
   * 凍結
   * 感電
   */
  statusAilment: z
    .string()
    .max(200)
    .optional(),

  /*
   * 状態異常・追加効果の時間
   */
  duration: z
    .number()
    .min(0)
    .optional(),

  /*
   * その他の効果
   *
   * 複数登録可能
   */
  extraEffects: z
    .array(
      z.string().max(2000),
    )
    .default([]),
});

export const SkillsSchema = z
  .array(SkillSchema)
  .default([]);

/* ============================================================
 * Traits
 * ============================================================ */

export const TraitSlotSchema = z.enum([
  "キャラ特性",
  "特性1",
  "特性2",
  "その他",
]);

export const TraitSchema = z.object({
  /*
   * どの特性枠なのか
   */
  slot: TraitSlotSchema,

  /*
   * 特性名
   *
   * 例:
   * キャラ特性
   * 特性1
   * 特性2
   */
  name: z
    .string()
    .min(1)
    .max(200),

  /*
   * 効果説明
   */
  effect: z
    .string()
    .min(1)
    .max(5000),
});

export const TraitsSchema = z
  .array(TraitSchema)
  .default([]);

/* ============================================================
 * Character Type
 *
 * マスターデータから選択する形式
 * ============================================================ */

export const CharacterTypeSchema = z.object({
  /*
   * マスターデータのID
   */
  typeId: z
    .string()
    .min(1)
    .max(100),

  /*
   * マスター側で定義された名称
   */
  name: z
    .string()
    .min(1)
    .max(200),

  /*
   * マスター側で定義された効果
   */
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
 *
 * マスターデータから選択する形式
 * ============================================================ */

export const TeamBoostSchema = z.object({
  /*
   * マスターデータのID
   */
  boostId: z
    .string()
    .min(1)
    .max(100),

  /*
   * チームブースト名
   */
  name: z
    .string()
    .min(1)
    .max(200),

  /*
   * 効果説明
   */
  effect: z
    .string()
    .min(1)
    .max(5000),
});

/* ============================================================
 * Common Character Fields
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
 * ============================================================ */

export const CreateCharacterSchema =
  z.object({
    /*
     * 内部ID
     */
    id: CharacterIdSchema,

    /*
     * キャラクター名
     */
    name: z
      .string()
      .trim()
      .min(1)
      .max(100),

    /*
     * 属性
     */
    attribute:
      CharacterAttributeChangeSchema,

    /*
     * 役職
     */
    role:
      CharacterRoleChangeSchema,

    /*
     * レアリティ
     */
    rarity:
      CharacterRaritySchema,

    /*
     * 初期★
     */
    initialStars:
      CharacterInitialStarsSchema,

    /*
     * ステータス
     */
    stats:
      CharacterStatsSchema,

    /*
     * スキル
     */
    skills:
      SkillsSchema,

    /*
     * 特性
     */
    traits:
      TraitsSchema,

    /*
     * キャラクタータイプ
     */
    characterTypes:
      CharacterTypesSchema,

    /*
     * チームブースト
     */
    teamBoost:
      TeamBoostSchema.optional(),

    /*
     * Tier
     */
    tier:
      CharacterTierSchema,

    /*
     * キャラクター画像
     */
    imageUrl:
      z
        .string()
        .url()
        .optional(),

    /*
     * 長所
     */
    strengths:
      z
        .array(
          z.string().max(500),
        )
        .default([]),

    /*
     * 短所
     */
    weaknesses:
      z
        .array(
          z.string().max(500),
        )
        .default([]),

    /*
     * おすすめメダル
     */
    recommendedMedals:
      z
        .array(
          z.string().max(200),
        )
        .default([]),

    /*
     * 関連キャラクター
     */
    relatedCharacters:
      z
        .array(
          z.string().max(100),
        )
        .default([]),
  });

/* ============================================================
 * Update Character
 *
 * IDは変更不可
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

/* ============================================================
 * Character Types
 * ============================================================ */

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