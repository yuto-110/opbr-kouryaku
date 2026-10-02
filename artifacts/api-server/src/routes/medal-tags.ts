import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { Medal, MedalTagMaster, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function cleanTagBody(body: any) {
  return {
    name: String(body?.name ?? "").trim(),
    twoSetEffect: String(body?.twoSetEffect ?? "").trim(),
    threeSetEffect: String(body?.threeSetEffect ?? "").trim(),
    active: body?.active !== false,
  };
}

async function makeTagId() {
  for (;;) {
    const id = `medal-tag-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    if (!(await MedalTagMaster.exists({ id }))) {
      return id;
    }
  }
}

router.get("/medal-tags", async (_req, res) => {
  try {
    await connectDB();
    const tags = await MedalTagMaster.find({ active: true }).sort({ name: 1 }).lean();
    return res.json(tags);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルタグの取得に失敗しました",
    });
  }
});

router.get("/medal-tags/:id/detail", async (req, res) => {
  try {
    await connectDB();
    const id = String(req.params.id ?? "").trim().toLowerCase();
    const tag = await MedalTagMaster.findOne({ id, active: true }).lean();

    if (!tag) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "メダルタグが見つかりません",
      });
    }

    const medals = await Medal.find({
      active: true,
      medalTagIds: id,
    })
      .sort({ name: 1 })
      .lean();

    return res.json({
      tag,
      medals,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "タグ詳細の取得に失敗しました",
    });
  }
});

router.get("/admin/medal-tags", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await connectDB();
    const tags = await MedalTagMaster.find().sort({ name: 1 }).lean();
    return res.json(tags);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルタグの取得に失敗しました",
    });
  }
});

router.post("/admin/medal-tags", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanTagBody(req.body);
    if (!input.name) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "タグ名を入力してください",
      });
    }

    await connectDB();

    const id = String(req.body?.id ?? "").trim().toLowerCase() || (await makeTagId());

    if (await MedalTagMaster.exists({ id })) {
      return res.status(409).json({
        code: "DUPLICATE_ID",
        message: "同じIDのメダルタグが既に存在します",
      });
    }

    if (await MedalTagMaster.exists({ name: input.name })) {
      return res.status(409).json({
        code: "DUPLICATE_NAME",
        message: "同じ名前のメダルタグが既に存在します",
      });
    }

    const created = await MedalTagMaster.create({
      ...input,
      id,
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルタグの保存に失敗しました",
    });
  }
});

router.put("/admin/medal-tags/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanTagBody(req.body);
    if (!input.name) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "タグ名を入力してください",
      });
    }

    await connectDB();
    const id = String(req.params.id ?? "").trim().toLowerCase();

    const duplicate = await MedalTagMaster.findOne({
      name: input.name,
      id: { $ne: id },
    }).select("_id");

    if (duplicate) {
      return res.status(409).json({
        code: "DUPLICATE_NAME",
        message: "同じ名前のメダルタグが既に存在します",
      });
    }

    const updated = await MedalTagMaster.findOneAndUpdate({ id }, input, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "メダルタグが見つかりません",
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルタグの更新に失敗しました",
    });
  }
});

router.delete("/admin/medal-tags/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const id = String(req.params.id ?? "").trim().toLowerCase();
    const updated = await MedalTagMaster.findOneAndUpdate(
      { id },
      { active: false },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "メダルタグが見つかりません",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルタグの削除に失敗しました",
    });
  }
});

export default router;
