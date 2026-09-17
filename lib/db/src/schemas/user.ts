import { Schema, model, type Document } from "mongoose";
import { z } from "zod";

export const UserRoleEnum = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof UserRoleEnum>;

export interface IOwnedCharacter {
  characterId: string;
  level: number;
}

export interface ISavedTeam {
  name: string;
  characterIds: string[];
}

export interface ISavedMedalTeam {
  name: string;
  medalIds: string[];
}

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  ownedCharacters: IOwnedCharacter[];
  favoriteCharacters: string[];
  savedSupportTeams: ISavedTeam[];
  savedMedalTeams: ISavedMedalTeam[];
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
      enum: ["admin", "user"],
      default: "user",
    },

    ownedCharacters: {
      type: [
        {
          characterId: {
            type: String,
            required: true,
          },
          level: {
            type: Number,
            default: 1,
            min: 1,
          },
        },
      ],
      default: [],
    },

    favoriteCharacters: {
      type: [String],
      default: [],
    },

    savedSupportTeams: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          characterIds: {
            type: [String],
            default: [],
          },
        },
      ],
      default: [],
    },

    savedMedalTeams: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          medalIds: {
            type: [String],
            default: [],
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export const User = model<IUser>("User", userSchema);