import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { ChallengeBattle, ChallengeRewardItem, Medal, MissionEvent, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import {
  FEATURE_DEFAULT_CATEGORIES,
  REWARD_CATEGORY_DEFS,
  REWARD_ITEM_CATEGORIES,
  STORABLE_CATEGORIES,
  toMedalItem,
  toStoredItem,
} from "../lib/reward-items";

const router: IRouter = Router();

function newId(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function cleanItemBody(body: any):
  | { value: { name: string; category: string; imageUrl: string; description: string; active: boolean } }
  | { error: string } {
  const name = String(body?.name ?? "").trim();
  if (!name) return { error: "アイテム名を入力してください" };
  if (name.length > 100) return { error: "アイテム名は100文字以内で入力してください" };

  const category = String(body?.category ?? "normal");
  if (!STORABLE_CATEGORIES.includes(category)) {
    return { error: "カテゴリが正しくありません（メダルはメダル管理画面で登録します）" };
  }

  const imageUrl = String(body?.imageUrl ?? "").trim();
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return { error: "画像URLは http:// または https:// で始まる必要があります" };
  }
  if (imageUrl.length > 2000) return { error: "画像URLが長すぎます" };

  const description = String(body?.description ?? "").trim();
  if (description.length > 2000) return { error: "説明は2000文字以内で入力してください" };

  return {
    value: { name, category, imageUrl, description, active: body?.active !== false },
  };
}

/** そのアイテムを報酬として参照している機能の件数 */
async function countUsages(itemId: string) {
  const [battles, events] = await Promise.all([
    ChallengeBattle.countDocuments({
      $or: [
        { "scoreRewards.normalRewards.itemId": itemId },
        { "scoreRewards.passLiteRewards.itemId": itemId },
        { "scoreRewards.passPremiumRewards.itemId": itemId },
        { "scoreRewards.passRewards.itemId": itemId },
        { "rankingRewards.rewards.itemId": itemId },
      ],
    }),
    MissionEvent.countDocuments({ "missions.rewards.itemId": itemId }),
  ]);
  return { challengeBattles: battles, missionEvents: events };
}

// 一覧：通常アイテム・メダル継承用アイテム（ChallengeRewardItem）＋ メダル（Medal）を統合して返す
router.get("/admin/reward-items", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();

    const category = String(req.query.category ?? "").trim();
    const q = String(req.query.q ?? "").trim().toLowerCase();
    const activeFilter = String(req.query.active ?? "").trim();

    if (category && !REWARD_ITEM_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "カテゴリが正しくありません" });
    }

    const [items, medals] = await Promise.all([
      category === "medal" ? Promise.resolve([]) : ChallengeRewardItem.find().lean(),
      !category || category === "medal"
        ? Medal.find().select("id name imageUrl active").lean()
        : Promise.resolve([]),
    ]);

    let list = [...items.map(toStoredItem), ...medals.map(toMedalItem)];

    if (category) list = list.filter((item) => item.category === category);
    if (q) list = list.filter((item) => item.name.toLowerCase().includes(q));
    if (activeFilter === "true") list = list.filter((item) => item.active);
    if (activeFilter === "false") list = list.filter((item) => !item.active);

    list.sort((a, b) => a.name.localeCompare(b.name, "ja"));

    return res.json({
      // カテゴリ定義と、報酬機能ごとの初期設定（画面はこれを元に選択肢を作る）
      categories: REWARD_CATEGORY_DEFS,
      featureDefaults: FEATURE_DEFAULT_CATEGORIES,
      items: list,
    });
  } catch (error) {
    console.error("[reward-items] list failed:", error);
    return res.status(500).json({ message: "アイテム一覧の取得に失敗しました" });
  }
});

router.get("/admin/reward-items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const item = await ChallengeRewardItem.findOne({ id: req.params.id }).lean();
    if (item) return res.json(toStoredItem(item));
    const medal = await Medal.findOne({ id: req.params.id }).select("id name imageUrl active").lean();
    if (medal) return res.json(toMedalItem(medal));
    return res.status(404).json({ message: "アイテムが見つかりません" });
  } catch (error) {
    console.error("[reward-items] detail failed:", error);
    return res.status(500).json({ message: "アイテムの取得に失敗しました" });
  }
});

router.post("/admin/reward-items", requireAuth, requireAdmin, async (req, res) => {
  const parsed = cleanItemBody(req.body);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  try {
    await connectDB();
    const item = await ChallengeRewardItem.create({ ...parsed.value, id: newId("item") });
    return res.status(201).json(toStoredItem(item.toObject()));
  } catch (error) {
    console.error("[reward-items] create failed:", error);
    return res.status(400).json({ message: "アイテムを保存できませんでした" });
  }
});

router.put("/admin/reward-items/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = cleanItemBody(req.body);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  try {
    await connectDB();
    const item = await ChallengeRewardItem.findOneAndUpdate(
      { id: req.params.id },
      parsed.value,
      { new: true, runValidators: true },
    ).lean();

    if (!item) {
      const isMedal = await Medal.exists({ id: req.params.id });
      if (isMedal) {
        return res.status(400).json({ message: "メダルはメダル管理画面で編集してください" });
      }
      return res.status(404).json({ message: "アイテムが見つかりません" });
    }
    return res.json(toStoredItem(item));
  } catch (error) {
    console.error("[reward-items] update failed:", error);
    return res.status(400).json({ message: "アイテムを更新できませんでした" });
  }
});

// 有効・無効の切り替え（無効化しても既存の報酬の表示・再保存はできる）
router.patch("/admin/reward-items/:id/active", requireAuth, requireAdmin, async (req, res) => {
  if (typeof req.body?.active !== "boolean") {
    return res.status(400).json({ message: "active は true / false で指定してください" });
  }

  try {
    await connectDB();
    const item = await ChallengeRewardItem.findOneAndUpdate(
      { id: req.params.id },
      { active: req.body.active },
      { new: true },
    ).lean();

    if (!item) {
      const isMedal = await Medal.exists({ id: req.params.id });
      if (isMedal) {
        return res.status(400).json({ message: "メダルの有効・無効はメダル管理画面で変更してください" });
      }
      return res.status(404).json({ message: "アイテムが見つかりません" });
    }
    return res.json(toStoredItem(item));
  } catch (error) {
    console.error("[reward-items] toggle failed:", error);
    return res.status(500).json({ message: "有効・無効の切り替えに失敗しました" });
  }
});

// 削除：どこからも参照されていない場合だけ。使用中は 409（無効化を案内）
router.delete("/admin/reward-items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const item = await ChallengeRewardItem.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ message: "アイテムが見つかりません" });

    const usage = await countUsages(req.params.id);
    if (usage.challengeBattles + usage.missionEvents > 0) {
      return res.status(409).json({
        message: `使用中のため削除できません（チャレバト ${usage.challengeBattles} 件、イベントミッション ${usage.missionEvents} 件）。代わりに無効化してください。`,
        usage,
      });
    }

    await ChallengeRewardItem.deleteOne({ id: req.params.id });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[reward-items] delete failed:", error);
    return res.status(500).json({ message: "アイテムの削除に失敗しました" });
  }
});

export default router;
