import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { Medal, MedalTagMaster, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

type AdditionalTrait = {
  stars: 1 | 2 | 3;
  content: string;
  drawRate: number;
};

function normalizeCandidate(value: unknown): AdditionalTrait | null {
  const item = value as Partial<AdditionalTrait> | undefined;
  const stars = Number(item?.stars);
  const drawRate = Number(item?.drawRate);
  if (![1, 2, 3].includes(stars) || !Number.isFinite(drawRate) || drawRate < 0) return null;
  return {
    stars: stars as 1 | 2 | 3,
    content: String(item?.content ?? "").trim(),
    drawRate,
  };
}

function normalizeTraits(value: unknown): [AdditionalTrait[], AdditionalTrait[], AdditionalTrait[]] {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: 3 }, (_, index) => {
    const legacy = source[index] && !Array.isArray(source[index])
      ? [source[index]]
      : [];
    const candidates = Array.isArray(source[index]) ? source[index] : legacy;
    return candidates.map(normalizeCandidate).filter((item): item is AdditionalTrait => item !== null);
  }) as [AdditionalTrait[], AdditionalTrait[], AdditionalTrait[]];
}

function cleanMedalBody(body: any) {
  return {
    name: String(body?.name ?? "").trim(),
    imageUrl: String(body?.imageUrl ?? "").trim(),
    uniqueTrait: String(body?.uniqueTrait ?? "").trim(),
    medalTags: Array.isArray(body?.medalTags)
      ? Array.from(new Set(body.medalTags.map((tag: unknown) => String(tag).trim()).filter(Boolean)))
      : [],
    additionalTraits: normalizeTraits(body?.additionalTraits),
    active: body?.active !== false,
  };
}

function cleanTagBody(body: any) {
  return {
    name: String(body?.name ?? "").trim(),
    effect: String(body?.effect ?? "").trim(),
    active: body?.active !== false,
  };
}

function newId(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

router.get("/medals", async (_req, res) => {
  try {
    await connectDB();
    return res.json(await Medal.find({ active: true }).sort({ name: 1 }).lean());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "メダルの取得に失敗しました" });
  }
});

router.get("/medals/:id", async (req, res) => {
  try {
    await connectDB();
    const medal = await Medal.findOne({ id: req.params.id, active: true }).lean();
    if (!medal) return res.status(404).json({ code: "NOT_FOUND", message: "メダルが見つかりません" });
    return res.json(medal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "メダルの取得に失敗しました" });
  }
});

router.get("/medal-tags", async (_req, res) => {
  try {
    await connectDB();
    return res.json(await MedalTagMaster.find({ active: true }).sort({ name: 1 }).lean());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "メダルタグの取得に失敗しました" });
  }
});

router.get("/admin/medals", requireAuth, requireAdmin, async (_req, res) => {
  await connectDB();
  return res.json(await Medal.find().sort({ name: 1 }).lean());
});

router.post("/admin/medals", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanMedalBody(req.body);
    if (!input.name) return res.status(400).json({ message: "メダル名を入力してください" });
    await connectDB();
    const medal = await Medal.create({ ...input, id: newId("medal") });
    return res.status(201).json(medal);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "メダルの保存に失敗しました" });
  }
});

router.put("/admin/medals/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanMedalBody(req.body);
    if (!input.name) return res.status(400).json({ message: "メダル名を入力してください" });
    await connectDB();
    const medal = await Medal.findOneAndUpdate({ id: req.params.id }, input, { new: true, runValidators: true }).lean();
    if (!medal) return res.status(404).json({ message: "メダルが見つかりません" });
    return res.json(medal);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "メダルの更新に失敗しました" });
  }
});

router.delete("/admin/medals/:id", requireAuth, requireAdmin, async (req, res) => {
  await connectDB();
  const medal = await Medal.findOneAndUpdate({ id: req.params.id }, { active: false }, { new: true }).lean();
  if (!medal) return res.status(404).json({ message: "メダルが見つかりません" });
  return res.json({ ok: true });
});

router.get("/admin/medal-tags", requireAuth, requireAdmin, async (_req, res) => {
  await connectDB();
  return res.json(await MedalTagMaster.find().sort({ name: 1 }).lean());
});

router.post("/admin/medal-tags", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanTagBody(req.body);
    if (!input.name) return res.status(400).json({ message: "タグ名を入力してください" });
    await connectDB();
    return res.status(201).json(await MedalTagMaster.create({ ...input, id: newId("medal-tag") }));
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "メダルタグの保存に失敗しました" });
  }
});

router.put("/admin/medal-tags/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanTagBody(req.body);
    if (!input.name) return res.status(400).json({ message: "タグ名を入力してください" });
    await connectDB();
    const tag = await MedalTagMaster.findOneAndUpdate({ id: req.params.id }, input, { new: true, runValidators: true }).lean();
    if (!tag) return res.status(404).json({ message: "メダルタグが見つかりません" });
    return res.json(tag);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "メダルタグの更新に失敗しました" });
  }
});

router.delete("/admin/medal-tags/:id", requireAuth, requireAdmin, async (req, res) => {
  await connectDB();
  const tag = await MedalTagMaster.findOneAndUpdate({ id: req.params.id }, { active: false }, { new: true }).lean();
  if (!tag) return res.status(404).json({ message: "メダルタグが見つかりません" });
  return res.json({ ok: true });
});

export default router;
