import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { ChallengeBattle, ChallengeRewardItem, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function newId(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function cleanRewardList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry: any) => ({
    itemId: String(entry?.itemId ?? "").trim(),
    quantity: Number(entry?.quantity),
  }));
}

function cleanBattleBody(body: any) {
  const scoreRewards = Array.isArray(body?.scoreRewards)
    ? body.scoreRewards.map((entry: any) => ({
        score: Number(entry?.score),
        normalRewards: cleanRewardList(entry?.normalRewards),
        passRewards: cleanRewardList(entry?.passRewards),
      }))
    : [];

  return {
    name: String(body?.name ?? "").trim(),
    bannerImageUrl: String(body?.bannerImageUrl ?? "").trim(),
    startDate: new Date(body?.startDate),
    endDate: new Date(body?.endDate),
    overview: String(body?.overview ?? "").trim(),
    rules: String(body?.rules ?? "").trim(),
    scoreRewards,
    active: body?.active !== false,
  };
}

function validateBattle(input: ReturnType<typeof cleanBattleBody>) {
  if (!input.name) return "イベント名を入力してください";
  if (Number.isNaN(input.startDate.getTime()) || Number.isNaN(input.endDate.getTime())) {
    return "開催期間を正しく入力してください";
  }
  if (input.endDate < input.startDate) return "終了日は開始日以降にしてください";

  for (const tier of input.scoreRewards) {
    if (!Number.isFinite(tier.score) || tier.score < 0) {
      return "スコア報酬のスコアは0以上で入力してください";
    }
    for (const reward of [...tier.normalRewards, ...tier.passRewards]) {
      if (!reward.itemId || !Number.isInteger(reward.quantity) || reward.quantity < 1) {
        return "報酬アイテムと1以上の個数を正しく入力してください";
      }
    }
  }
  return null;
}

function cleanItemBody(body: any) {
  return {
    name: String(body?.name ?? "").trim(),
    imageUrl: String(body?.imageUrl ?? "").trim(),
    description: String(body?.description ?? "").trim(),
    active: body?.active !== false,
  };
}

async function hydrateBattle(battle: any) {
  const data = typeof battle?.toObject === "function" ? battle.toObject() : battle;
  const itemIds = new Set<string>();
  for (const tier of data.scoreRewards ?? []) {
    for (const reward of [...(tier.normalRewards ?? []), ...(tier.passRewards ?? [])]) {
      if (reward.itemId) itemIds.add(reward.itemId);
    }
  }
  const items = await ChallengeRewardItem.find({ id: { $in: [...itemIds] } }).lean();
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return {
    ...data,
    scoreRewards: (data.scoreRewards ?? []).map((tier: any) => ({
      ...tier,
      normalRewards: (tier.normalRewards ?? []).map((reward: any) => ({
        ...reward,
        item: itemMap.get(reward.itemId) ?? null,
      })),
      passRewards: (tier.passRewards ?? []).map((reward: any) => ({
        ...reward,
        item: itemMap.get(reward.itemId) ?? null,
      })),
    })),
  };
}

// 公開API：終了済みイベントも一覧・詳細で閲覧できる
router.get("/challenge-battles", async (_req, res) => {
  try {
    await connectDB();
    const battles = await ChallengeBattle.find({ active: true }).sort({ startDate: -1 }).lean();
    return res.json(await Promise.all(battles.map(hydrateBattle)));
  } catch (error) {
    console.error("[challenge-battles] list failed:", error);
    return res.status(500).json({ message: "チャレバト一覧の取得に失敗しました" });
  }
});

router.get("/challenge-battles/:id", async (req, res) => {
  try {
    await connectDB();
    const battle = await ChallengeBattle.findOne({ id: req.params.id, active: true }).lean();
    if (!battle) return res.status(404).json({ message: "チャレバトが見つかりません" });
    return res.json(await hydrateBattle(battle));
  } catch (error) {
    console.error("[challenge-battles] detail failed:", error);
    return res.status(500).json({ message: "チャレバトの取得に失敗しました" });
  }
});

// 報酬アイテム管理
router.get("/admin/challenge-reward-items", requireAuth, requireAdmin, async (_req, res) => {
  await connectDB();
  return res.json(await ChallengeRewardItem.find().sort({ name: 1 }).lean());
});

router.post("/admin/challenge-reward-items", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanItemBody(req.body);
    if (!input.name) return res.status(400).json({ message: "報酬名を入力してください" });
    await connectDB();
    const item = await ChallengeRewardItem.create({ ...input, id: newId("challenge-reward") });
    return res.status(201).json(item);
  } catch (error) {
    console.error("[challenge-reward-items] create failed:", error);
    return res.status(400).json({ message: "報酬アイテムを保存できませんでした" });
  }
});

router.put("/admin/challenge-reward-items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanItemBody(req.body);
    if (!input.name) return res.status(400).json({ message: "報酬名を入力してください" });
    await connectDB();
    const item = await ChallengeRewardItem.findOneAndUpdate(
      { id: req.params.id }, input, { new: true, runValidators: true },
    ).lean();
    if (!item) return res.status(404).json({ message: "報酬アイテムが見つかりません" });
    return res.json(item);
  } catch (error) {
    console.error("[challenge-reward-items] update failed:", error);
    return res.status(400).json({ message: "報酬アイテムを更新できませんでした" });
  }
});

router.delete("/admin/challenge-reward-items/:id", requireAuth, requireAdmin, async (req, res) => {
  await connectDB();
  const item = await ChallengeRewardItem.findOneAndUpdate(
    { id: req.params.id }, { active: false }, { new: true },
  ).lean();
  if (!item) return res.status(404).json({ message: "報酬アイテムが見つかりません" });
  return res.json({ ok: true });
});

// チャレバト管理
router.get("/admin/challenge-battles", requireAuth, requireAdmin, async (_req, res) => {
  await connectDB();
  const battles = await ChallengeBattle.find().sort({ startDate: -1 }).lean();
  return res.json(await Promise.all(battles.map(hydrateBattle)));
});

router.post("/admin/challenge-battles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanBattleBody(req.body);
    const validation = validateBattle(input);
    if (validation) return res.status(400).json({ message: validation });
    await connectDB();

    const itemIds = input.scoreRewards.flatMap((tier: { score: number; normalRewards: { itemId: string; quantity: number }[]; passRewards: { itemId: string; quantity: number }[] }) =>
      [...tier.normalRewards, ...tier.passRewards].map((reward) => reward.itemId),
    );
    const existingItems = await ChallengeRewardItem.find({ id: { $in: itemIds }, active: true }).select("id").lean();
    const existingIds = new Set(existingItems.map((item) => item.id));
    if (itemIds.some((id: string) => !existingIds.has(id))) {
      return res.status(400).json({ message: "登録済みの有効な報酬アイテムを選択してください" });
    }

    const battle = await ChallengeBattle.create({ ...input, id: newId("challenge-battle") });
    return res.status(201).json(await hydrateBattle(battle));
  } catch (error) {
    console.error("[admin/challenge-battles] create failed:", error);
    return res.status(400).json({ message: "チャレバトを保存できませんでした" });
  }
});

router.put("/admin/challenge-battles/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const input = cleanBattleBody(req.body);
    const validation = validateBattle(input);
    if (validation) return res.status(400).json({ message: validation });
    await connectDB();

    const itemIds = input.scoreRewards.flatMap((tier: { score: number; normalRewards: { itemId: string; quantity: number }[]; passRewards: { itemId: string; quantity: number }[] }) =>
      [...tier.normalRewards, ...tier.passRewards].map((reward) => reward.itemId),
    );
    const existingItems = await ChallengeRewardItem.find({ id: { $in: itemIds }, active: true }).select("id").lean();
    const existingIds = new Set(existingItems.map((item) => item.id));
    if (itemIds.some((id: string) => !existingIds.has(id))) {
      return res.status(400).json({ message: "登録済みの有効な報酬アイテムを選択してください" });
    }

    const battle = await ChallengeBattle.findOneAndUpdate(
      { id: req.params.id }, input, { new: true, runValidators: true },
    ).lean();
    if (!battle) return res.status(404).json({ message: "チャレバトが見つかりません" });
    return res.json(await hydrateBattle(battle));
  } catch (error) {
    console.error("[admin/challenge-battles] update failed:", error);
    return res.status(400).json({ message: "チャレバトを更新できませんでした" });
  }
});

router.delete("/admin/challenge-battles/:id", requireAuth, requireAdmin, async (req, res) => {
  await connectDB();
  const battle = await ChallengeBattle.findOneAndUpdate(
    { id: req.params.id }, { active: false }, { new: true },
  ).lean();
  if (!battle) return res.status(404).json({ message: "チャレバトが見つかりません" });
  return res.json({ ok: true });
});

export default router;
