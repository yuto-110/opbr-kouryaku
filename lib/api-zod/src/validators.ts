import { z } from 'zod';

// User schemas
export const UserRoleSchema = z.enum(['admin', 'user']);

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

// Character schemas
export const CharacterRaritySchema = z.enum(['伝説', '超激レア', '激レア', 'レア']);
export const CharacterRoleSchema = z.enum(['アタッカー', 'ディフェンダー', 'サポート', 'コントロール']);

const StatSchema = z.object({
  label: z.string(),
  value: z.number().int().min(0).max(100),
});

const SkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  cooldown: z.number().int().min(0),
});

const TraitSchema = z.object({
  name: z.string().min(1).max(100),
  effect: z.string().min(1).max(500),
});

export const CreateCharacterSchema = z.object({
  id: z.string().toLowerCase().regex(/^[a-z0-9-]+$/, 'Only lowercase alphanumeric and hyphens allowed'),
  name: z.string().min(1).max(100),
  reading: z.string().min(1).max(100),
  faction: z.string().min(1).max(100),
  role: CharacterRoleSchema,
  rarity: CharacterRaritySchema,
  element: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a valid hex color'),
  stats: z.array(StatSchema).min(1),
  description: z.string().min(1).max(2000),
  skills: z.array(SkillSchema),
  traits: z.array(TraitSchema),
  tags: z.array(z.string()).default([]),
  tier: z.string().min(1).max(10),
  imageUrl: z.string().url().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedMedals: z.array(z.string()).default([]),
  relatedCharacters: z.array(z.string()).default([]),
  implementedAt: z.date().optional(),
});

export const UpdateCharacterSchema = CreateCharacterSchema.partial();

export const CharacterResponseSchema = z.object({
  _id: z.string(),
  id: z.string(),
  name: z.string(),
  reading: z.string(),
  faction: z.string(),
  role: CharacterRoleSchema,
  rarity: CharacterRaritySchema,
  element: z.string(),
  color: z.string(),
  stats: z.array(StatSchema),
  description: z.string(),
  skills: z.array(SkillSchema),
  traits: z.array(TraitSchema),
  tags: z.array(z.string()),
  tier: z.string(),
  imageUrl: z.string().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedMedals: z.array(z.string()),
  relatedCharacters: z.array(z.string()),
  implementedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type CreateCharacterInput = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof UpdateCharacterSchema>;
export type CharacterResponse = z.infer<typeof CharacterResponseSchema>;
