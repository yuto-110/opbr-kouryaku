import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, connectDB } from "@workspace/db";
import {
  CreateUserSchema,
  LoginSchema,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return secret;
}

function createAccessToken(userId: string): string {
  return jwt.sign(
    {
      userId,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
    },
  );
}

/**
 * ユーザー登録
 * POST /auth/register
 */
router.post("/auth/register", async (req, res) => {
  try {
    const input = CreateUserSchema.parse(req.body);

    await connectDB();

    const username = input.username.trim();
    const email = input.email.toLowerCase();

    // 既存ユーザー確認
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email },
      ],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({
          code: "USERNAME_ALREADY_EXISTS",
          message: "そのユーザー名はすでに使用されています",
        });
      }

      return res.status(409).json({
        code: "EMAIL_ALREADY_EXISTS",
        message: "そのメールアドレスはすでに登録されています",
      });
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(input.password, 12);

    // role はクライアントから受け取った値を使用せず、
    // 一般ユーザーとして登録する
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: "user",
      ownedCharacters: [],
      favoriteCharacters: [],
      savedSupportTeams: [],
      savedMedalTeams: [],
    });

    const accessToken = createAccessToken(user._id.toString());

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
      tokenType: "Bearer",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({
        code: "INVALID_REQUEST",
        message: "入力内容が正しくありません",
      });
    }

    // MongoDB の unique 制約に引っかかった場合
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        code: "USER_ALREADY_EXISTS",
        message: "そのユーザー名またはメールアドレスはすでに使用されています",
      });
    }

    console.error(error);

    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "サーバーエラーが発生しました",
    });
  }
});

/**
 * ログイン
 * POST /auth/login
 */
router.post("/auth/login", async (req, res) => {
  try {
    const input = LoginSchema.parse(req.body);

    await connectDB();

    const user = await User.findOne({
      email: input.email.toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "メールアドレスまたはパスワードが正しくありません",
      });
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "メールアドレスまたはパスワードが正しくありません",
      });
    }

    const accessToken = createAccessToken(user._id.toString());

    return res.json({
      accessToken,
      tokenType: "Bearer",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({
        code: "INVALID_REQUEST",
        message: "入力内容が正しくありません",
      });
    }

    console.error(error);

    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "サーバーエラーが発生しました",
    });
  }
});

export default router;