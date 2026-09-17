import { Schema, model, type Document } from 'mongoose';
import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'admin',
  'user',
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

export interface IOwnedCharacter {
  // キャラクターマスターのID
  characterId: string;

  // ユーザーが現在所持している★
  // ★2〜★6
  stars: number;

  // ユーザーが現在設定しているレベル
  // Lv1〜Lv100
  level: number;

  // ブースト段階
  //
  // 現時点では数値として保存する。
  // 各段階の正式な意味・名称・上限については、
  // 実際のゲーム仕様を確認してから確定する。
  boostLevel: number;
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

  // ユーザーが所持しているキャラクター
  ownedCharacters: IOwnedCharacter[];

  // お気に入りキャラクター
  favoriteCharacters: string[];

  // 保存したサポート編成
  savedSupportTeams: ISavedTeam[];

  // 保存したメダル編成
  savedMedalTeams: ISavedMedalTeam[];

  createdAt: Date;
  updatedAt: Date;
}

const ownedCharacterSchema = new Schema<IOwnedCharacter>(
  {
    characterId: {
      type: String,
      required: true,
    },

    stars: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
    },

    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 100,
    },

    boostLevel: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const savedTeamSchema = new Schema<ISavedTeam>(
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
  {
    _id: false,
  },
);

const savedMedalTeamSchema = new Schema<ISavedMedalTeam>(
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
  {
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: UserRoleEnum.options,
      default: 'user',
      required: true,
    },

    ownedCharacters: {
      type: [ownedCharacterSchema],
      default: [],
    },

    favoriteCharacters: {
      type: [String],
      default: [],
    },

    savedSupportTeams: {
      type: [savedTeamSchema],
      default: [],
    },

    savedMedalTeams: {
      type: [savedMedalTeamSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>(
  'User',
  userSchema,
);