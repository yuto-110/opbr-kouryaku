import { Router, type IRouter } from "express";
import {
  Character,
  connectDB,
} from "@workspace/db";
import {
  CreateCharacterSchema,
  UpdateCharacterSchema,
} from "@workspace/api-zod";
import {
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/auth";

const router: IRouter = Router();

router.get("/characters", async (_req, res) => {
  try {
    await connectDB();

    const characters = await Character.find()
      .sort({ name: 1 })
      .lean();

    return res.json(characters);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "キャラクターデータの取得に失敗しました",
    });
  }
});

router.get("/characters/:id", async (req, res) => {
  try {
    await connectDB();

    const character = await Character.findOne({
      id: req.params.id,
    }).lean();

    if (!character) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "キャラクターが見つかりません",
      });
    }

    return res.json(character);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "キャラクターデータの取得に失敗しました",
    });
  }
});

router.post(
  "/characters",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const input = CreateCharacterSchema.parse(req.body);

      await connectDB();

      const existing = await Character.findOne({ id: input.id });

      if (existing) {
        return res.status(409).json({
          code: "DUPLICATE_ID",
          message: "同じIDのキャラクターが既に存在します",
        });
      }

      const character = await Character.create(input);

      return res.status(201).json(character);
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
        message: "キャラクターの作成に失敗しました",
      });
    }
  },
);

router.put(
  "/characters/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const input = UpdateCharacterSchema.parse(req.body);

      await connectDB();

      const character = await Character.findOneAndUpdate(
        { id: req.params.id },
        { $set: input },
        {
          new: true,
          runValidators: true,
        },
      ).lean();

      if (!character) {
        return res.status(404).json({
          code: "NOT_FOUND",
          message: "キャラクターが見つかりません",
        });
      }

      return res.json(character);
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
        message: "キャラクターの更新に失敗しました",
      });
    }
  },
);

router.delete(
  "/characters/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      await connectDB();

      const result = await Character.deleteOne({
        id: req.params.id,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          code: "NOT_FOUND",
          message: "キャラクターが見つかりません",
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "キャラクターの削除に失敗しました",
      });
    }
  },
);

export default router;
