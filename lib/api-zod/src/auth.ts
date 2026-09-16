import { z } from 'zod';

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
});

export const AuthErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type AuthError = z.infer<typeof AuthErrorSchema>;
