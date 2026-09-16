import { Schema, model, type Document } from 'mongoose';
import { z } from 'zod';

export const UserRoleEnum = z.enum(['admin', 'user']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export const User = model<IUser>('User', userSchema);
