import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, connectDB } from "@workspace/db";
import { LoginSchema } from "@workspace/api-zod";

const router: IRouter = Router();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return secret;
}

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

    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
      },
      getJwtSecret(),
      {
        expiresIn: "7d",
      },
    );

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
