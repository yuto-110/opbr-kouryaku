import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { Medal, MedalTagMaster, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

type LotteryInput = {
  star: number;
  effect: string;
  probability: string;
};

function normalizeLottery(items: unknown): LotteryInput[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      star: Number((item as any)?.star),
      effect: String((item as any)?.effect ?? "").trim(),
      probability: String((item as any)?.probability ?? "").trim(),
    }))
    .filter(
      (item) =>
        [1, 2, 3].includes(item.star) &&
        item.effect.length > 0 &&
        item.probability.length > 0,
    );
}

function cleanMedalBody(body: any) {
  return {
    name: String(body?.name ?? "").trim(),
    imageUrl: String(body?.imageUrl ?? "").trim(),
    uniqueTrait: String(body?.uniqueTrait ?? "").trim(),
    additionalTrait1: String(body?.additionalTrait1 ?? "").trim(),
    additionalTrait2: String(body?.additionalTrait2 ?? "").trim(),
    additionalTrait3: String(body?.additionalTrait3 ?? "").trim(),
    medalTagIds: Array.isArray(body?.medalTagIds)
      ? body.medalTagIds
          .map((item: unknown) => String(item ?? "").trim().toLowerCase())
          .filter(Boolean)
      : [],
    tagEffect: String(body?.tagEffect ?? "").trim(),
    additionalLotteries: normalizeLottery(body?.additionalLotteries),
    active: body?.active !== false,
  };
}

async function makeMedalId() {
  for (;;) {
    const id = `medal-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    if (!(await Medal.exists({ id }))) {
      return id;
    }
  }
}

async function validateTagIds(medalTagIds: string[]) {
  if (!medalTagIds.length) return true;
  const count = await MedalTagMaster.countDocuments({
    id: { $in: medalTagIds },
    active: true,
  });
  return count === medalTagIds.length;
}

router.get("/medals", async (req, res) => {
  try {
    await connectDB();
    const queryTag = String(req.query.tag ?? "").trim().toLowerCase();
    const filter: Record<string, unknown> = { active: true };
    if (queryTag) {
      filter.medalTagIds = queryTag;
    }
    const medals = await Medal.find(filter).sort({ name: 1 }).lean();
    return res.json(medals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダル一覧の取得に失敗しました",
    });
  }
});

router.get("/medals/:id", async (req, res) => {
  try {
    await connectDB();
    const id = String(req.params.id ?? "").trim().toLowerCase();
    const medal = await Medal.findOne({ id, active: true }).lean();
    if (!medal) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "メダルが見つかりません",
      });
    }
    return res.json(medal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダル取得に失敗しました",
    });
  }
});

router.get("/admin/medals", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await connectDB();
    const medals = await Medal.find().sort({ name: 1 }).lean();
    return res.json(medals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダル一覧の取得に失敗しました",
    });
  }
});

router.post("/admin/medals", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanMedalBody(req.body);
    if (!input.name) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "メダル名を入力してください",
      });
    }

    await connectDB();

    if (!(await validateTagIds(input.medalTagIds))) {
      return res.status(400).json({
        code: "INVALID_TAG",
        message: "無効なメダルタグが含まれています",
      });
    }

    const id = String(req.body?.id ?? "").trim().toLowerCase() || (await makeMedalId());

    if (await Medal.exists({ id })) {
      return res.status(409).json({
        code: "DUPLICATE_ID",
        message: "同じIDのメダルが既に存在します",
      });
    }

    const created = await Medal.create({ ...input, id });
    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルの保存に失敗しました",
    });
  }
});

router.put("/admin/medals/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanMedalBody(req.body);
    if (!input.name) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "メダル名を入力してください",
      });
    }

    await connectDB();

    if (!(await validateTagIds(input.medalTagIds))) {
      return res.status(400).json({
        code: "INVALID_TAG",
        message: "無効なメダルタグが含まれています",
      });
    }

    const id = String(req.params.id ?? "").trim().toLowerCase();
    const updated = await Medal.findOneAndUpdate({ id }, input, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "メダルが見つかりません",
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルの更新に失敗しました",
    });
  }
});

router.delete("/admin/medals/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const id = String(req.params.id ?? "").trim().toLowerCase();
    const updated = await Medal.findOneAndUpdate(
      { id },
      { active: false },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "メダルが見つかりません",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "メダルの削除に失敗しました",
    });
  }
});

export default router;
