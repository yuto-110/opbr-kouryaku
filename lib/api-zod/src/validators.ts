import { z } from 'zod';

export const HealthCheckResponse = z.object({
  status: z.literal('ok'),
});

// ============================================================
// User
// ============================================================

export const UserRoleSchema = z.enum([
  'admin',
  'user',
]);

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: UserRoleSchema.default('user'),
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

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

// ============================================================
// Character
// ============================================================

export const CharacterAttributeSchema = z.enum([
  '赤',
  '青',
  '緑',
  '黒',
  '白',
]);

export const CharacterRoleSchema = z.enum([
  'アタッカー',
  'ゲッター',
  'ディフェンダー',
]);

export const CharacterRaritySchema = z.enum([
  'レジェンダリー',
  '超レジェンダリー',
  '恒常',
]);

export const CharacterInitialStarsSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const CharacterTierSchema = z.enum([
  'SS',
  'S+',
  'S',
  'A+',
  'A',
  'B+',
  'B',
]);

const ChangeOptionSchema = <T extends z.ZodTypeAny>(
  schema: T,
) =>
  z.object({
    base: schema,
    changesTo: z.array(schema).default([]),
  });

const StatValuesSchema = z.object({
  totalPower: z.number().min(0),
  hp: z.number().min(0),
  attack: z.number().min(0),
  defense: z.number().min(0),
  critical: z.number().min(0),
});

const LevelStatSchema = StatValuesSchema.extend({
  level: z.number().int().min(1).max(100),
});

const CharacterStatsSchema = z.object({
  levelStats: z.array(LevelStatSchema).default([]),

  level100Overboost: StatValuesSchema.optional(),
});

const SkillSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  cooldown: z.number().min(0).optional(),
});

const TraitSchema = z.object({
  name: z.string().min(1).max(200),
  effect: z.string().min(1).max(2000),
});

const CharacterTypeSchema = z.object({
  typeId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  effect: z.string().max(2000).optional(),
  effectLevel: z.number().int().min(0).optional(),
});

const CharacterIdSchema = z
  .string()
  .toLowerCase()
  .regex(
    /^[a-z0-9-]+$/,
    'IDは半角小文字英数字とハイフンのみ使用できます',
  );

const ImplementedAtSchema = z.coerce.date().optional();

export const CreateCharacterSchema = z.object({
  id: CharacterIdSchema,

  name: z.string().min(1).max(100),

  reading: z.string().min(1).max(100),

  attribute: ChangeOptionSchema(
    CharacterAttributeSchema,
  ),

  role: ChangeOptionSchema(
    CharacterRoleSchema,
  ),

  rarity: CharacterRaritySchema,

  initialStars: CharacterInitialStarsSchema,

  stats: CharacterStatsSchema,

  description: z
    .string()
    .max(5000)
    .optional(),

  skills: z
    .array(SkillSchema)
    .default([]),

  traits: z
    .array(TraitSchema)
    .default([]),

  characterTypes: z
    .array(CharacterTypeSchema)
    .default([]),

  teamBoost: z
    .string()
    .max(200)
    .optional(),

  tier: CharacterTierSchema,

  imageUrl: z
    .string()
    .url()
    .optional(),

  strengths: z
    .array(z.string().max(500))
    .default([]),

  weaknesses: z
    .array(z.string().max(500))
    .default([]),

  recommendedMedals: z
    .array(z.string().max(200))
    .default([]),

  relatedCharacters: z
    .array(z.string().max(100))
    .default([]),

  implementedAt: ImplementedAtSchema,
});

// IDは更新後も変えない
export const UpdateCharacterSchema =
  CreateCharacterSchema
    .omit({
      id: true,
    })
    .partial();

export const CharacterResponseSchema = z.object({
  _id: z.string(),

  id: z.string(),

  name: z.string(),

  reading: z.string(),

  attribute: ChangeOptionSchema(
    CharacterAttributeSchema,
  ),

  role: ChangeOptionSchema(
    CharacterRoleSchema,
  ),

  rarity: CharacterRaritySchema,

  initialStars: CharacterInitialStarsSchema,

  stats: CharacterStatsSchema,

  description: z.string().optional(),

  skills: z.array(SkillSchema),

  traits: z.array(TraitSchema),

  characterTypes: z.array(CharacterTypeSchema),

  teamBoost: z.string().optional(),

  tier: CharacterTierSchema,

  imageUrl: z.string().optional(),

  strengths: z.array(z.string()),

  weaknesses: z.array(z.string()),

  recommendedMedals: z.array(z.string()),

  relatedCharacters: z.array(z.string()),

  implementedAt: z.date().optional(),

  createdAt: z.date(),

  updatedAt: z.date(),
});

export type CreateCharacterInput = z.infer<
  typeof CreateCharacterSchema
>;

export type UpdateCharacterInput = z.infer<
  typeof UpdateCharacterSchema
>;

export type CharacterResponse = z.infer<
  typeof CharacterResponseSchema
>;