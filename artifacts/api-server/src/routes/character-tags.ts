import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { CharacterTagMaster, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function normalizeLevels(levels: unknown) {
  const source = Array.isArray(levels) ? levels : [];

  return Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;

    const found = source.find(
      (item: any) => Number(item?.level) === level,
    );

    return {
      level,
      totalLevel: Math.max(
        0,
        Number(found?.totalLevel ?? 0) || 0,
      ),
      effect: String(found?.effect ?? "").trim(),
    };
  });
}

async function makeId() {
  for (;;) {
    const id = `tag-${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    if (!(await CharacterTagMaster.exists({ id }))) {
      return id;
    }
  }
}

function cleanBody(body: any) {
  return {
    name: String(body?.name ?? "").trim(),

    supportEffect: String(
      body?.supportEffect ?? "",
    ).trim(),

    supportCategory:
      String(body?.supportCategory ?? "その他").trim() ||
      "その他",

    levels: normalizeLevels(body?.levels),

    active: body?.active !== false,
  };
}

/**
 * 一般ユーザー向け
 * 有効なキャラクタータグだけ取得
 */
router.get("/character-tags", async (_req, res) => {
  try {
    await connectDB();

    const tags = await CharacterTagMaster.find({
      active: true,
    })
      .sort({ name: 1 })
      .lean();

    return res.json(tags);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "キャラクタータグの取得に失敗しました",
    });
  }
});

/**
 * 管理者向け
 * 全キャラクタータグ取得
 */
router.get(
  "/admin/character-tags",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      await connectDB();

      const tags = await CharacterTagMaster.find()
        .sort({ name: 1 })
        .lean();

      return res.json(tags);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "キャラクタータグの取得に失敗しました",
      });
    }
  },
);

/**
 * キャラクタータグ新規作成
 */
router.post(
  "/admin/character-tags",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const input = cleanBody(req.body);

      if (!input.name) {
        return res.status(400).json({
          code: "INVALID_INPUT",
          message: "タグ名を入力してください",
        });
      }

      await connectDB();

      const id =
        String(req.body?.id ?? "").trim().toLowerCase() ||
        (await makeId());

      if (await CharacterTagMaster.exists({ id })) {
        return res.status(409).json({
          code: "DUPLICATE_ID",
          message: "同じIDのタグが既に存在します",
        });
      }

      if (
        await CharacterTagMaster.exists({
          name: input.name,
        })
      ) {
        return res.status(409).json({
          code: "DUPLICATE_NAME",
          message: "同じ名前のタグが既に存在します",
        });
      }

      const created = await CharacterTagMaster.create({
        ...input,
        id,
      });

      return res.status(201).json(created);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "タグの保存に失敗しました",
      });
    }
  },
);

/**
 * キャラクタータグ更新
 */
router.put(
  "/admin/character-tags/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const input = cleanBody(req.body);

      if (!input.name) {
        return res.status(400).json({
          code: "INVALID_INPUT",
          message: "タグ名を入力してください",
        });
      }

      await connectDB();

      const id = String(
        req.params.id ?? "",
      )
        .trim()
        .toLowerCase();

      const duplicate =
        await CharacterTagMaster.findOne({
          name: input.name,
          id: { $ne: id },
        }).select("_id");

      if (duplicate) {
        return res.status(409).json({
          code: "DUPLICATE_NAME",
          message: "同じ名前のタグが既に存在します",
        });
      }

      const updated =
        await CharacterTagMaster.findOneAndUpdate(
          { id },
          input,
          {
            new: true,
            runValidators: true,
          },
        ).lean();

      if (!updated) {
        return res.status(404).json({
          code: "NOT_FOUND",
          message: "タグが見つかりません",
        });
      }

      return res.json(updated);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "タグの更新に失敗しました",
      });
    }
  },
);

/**
 * キャラクタータグ無効化
 */
router.delete(
  "/admin/character-tags/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await connectDB();

      const id = String(
        req.params.id ?? "",
      )
        .trim()
        .toLowerCase();

      const updated =
        await CharacterTagMaster.findOneAndUpdate(
          { id },
          { active: false },
          { new: true },
        ).lean();

      if (!updated) {
        return res.status(404).json({
          code: "NOT_FOUND",
          message: "タグが見つかりません",
        });
      }

      return res.json(updated);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "タグの削除に失敗しました",
      });
    }
  },
);

export default router;
