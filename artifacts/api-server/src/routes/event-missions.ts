import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { MissionEvent, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { resolveRewardItems, validateRewardItemIds } from "../lib/reward-items";

const router: IRouter = Router();

const MAX_MISSIONS = 200;
const MAX_REWARDS_PER_MISSION = 50;
const MAX_QUANTITY = 99_999_999;
const MAX_REQUIRED_COUNT = 1_000_000_000;

function newId(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function parseOptionalDate(value: unknown): Date | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

function isInt(value: number, min: number, max: number) {
  return Number.isInteger(value) && value >= min && value <= max;
}

type CleanMission = {
  id: string;
  name: string;
  condition: string;
  requiredCount: number;
  deadline: Date | null;
  rewards: { itemId: string; quantity: number }[];
  sortOrder: number;
  published: boolean;
};

type CleanEvent = {
  name: string;
  eventCategory: string;
  description: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  published: boolean;
  sortOrder: number;
  missions: CleanMission[];
};

/** 入力値のサーバー側検証。クライアントの検証には依存しない。 */
function cleanEventBody(body: any): { value: CleanEvent } | { error: string } {
  const name = String(body?.name ?? "").trim();
  if (!name) return { error: "イベント名を入力してください" };
  if (name.length > 100) return { error: "イベント名は100文字以内で入力してください" };

  const eventCategory = String(body?.eventCategory ?? "ミッション").trim() || "ミッション";
  if (eventCategory.length > 50) return { error: "イベントカテゴリは50文字以内で入力してください" };

  const description = String(body?.description ?? "").trim();
  if (description.length > 5000) return { error: "説明は5000文字以内で入力してください" };

  const imageUrl = String(body?.imageUrl ?? "").trim();
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return { error: "画像URLは http:// または https:// で始まる必要があります" };
  }
  if (imageUrl.length > 2000) return { error: "画像URLが長すぎます" };

  const startDate = parseOptionalDate(body?.startDate);
  const endDate = parseOptionalDate(body?.endDate);
  if (!startDate || startDate === "invalid") return { error: "開始日時を正しく入力してください" };
  if (!endDate || endDate === "invalid") return { error: "終了日時を正しく入力してください" };
  if (endDate.getTime() <= startDate.getTime()) {
    return { error: "終了日時は開始日時より後にしてください" };
  }

  const sortOrder = Number(body?.sortOrder ?? 0);
  if (!isInt(sortOrder, -100000, 100000)) {
    return { error: "表示順は整数（-100000〜100000）で入力してください" };
  }

  const rawMissions: any[] = Array.isArray(body?.missions) ? body.missions : [];
  if (rawMissions.length > MAX_MISSIONS) {
    return { error: `ミッションは${MAX_MISSIONS}件までです` };
  }

  const missions: CleanMission[] = [];
  const usedIds = new Set<string>();

  for (let index = 0; index < rawMissions.length; index += 1) {
    const raw = rawMissions[index] ?? {};
    const label = `ミッション${index + 1}`;

    const missionName = String(raw.name ?? "").trim();
    if (!missionName) return { error: `${label}の名前を入力してください` };
    if (missionName.length > 100) return { error: `${label}の名前は100文字以内で入力してください` };

    const condition = String(raw.condition ?? "").trim();
    if (condition.length > 1000) return { error: `${label}の達成条件は1000文字以内で入力してください` };

    const requiredCount = Number(raw.requiredCount ?? 1);
    if (!isInt(requiredCount, 1, MAX_REQUIRED_COUNT)) {
      return { error: `${label}の必要な達成数は1以上の整数で入力してください` };
    }

    const deadline = parseOptionalDate(raw.deadline);
    if (deadline === "invalid") return { error: `${label}の期限を正しく入力してください` };

    const rawRewards: any[] = Array.isArray(raw.rewards) ? raw.rewards : [];
    if (rawRewards.length > MAX_REWARDS_PER_MISSION) {
      return { error: `${label}の報酬は${MAX_REWARDS_PER_MISSION}件までです` };
    }

    const rewards: { itemId: string; quantity: number }[] = [];
    for (const reward of rawRewards) {
      const itemId = String(reward?.itemId ?? "").trim();
      const quantity = Number(reward?.quantity);
      if (!itemId) return { error: `${label}：報酬アイテムを選択してください` };
      if (!isInt(quantity, 1, MAX_QUANTITY)) {
        return { error: `${label}：報酬の個数は1〜${MAX_QUANTITY.toLocaleString("ja-JP")}の整数で入力してください` };
      }
      rewards.push({ itemId, quantity });
    }

    let id = String(raw.id ?? "").trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || usedIds.has(id)) id = newId("mission");
    usedIds.add(id);

    missions.push({
      id,
      name: missionName,
      condition,
      requiredCount,
      deadline,
      rewards,
      sortOrder: index, // 配列の順序＝表示順
      published: raw.published !== false,
    });
  }

  return {
    value: {
      name,
      eventCategory,
      description,
      imageUrl,
      startDate,
      endDate,
      published: body?.published === true,
      sortOrder,
      missions,
    },
  };
}

type HydratedReward = { itemId: string; quantity: number; item: any | null };

async function hydrateEvent(event: any, options: { publicOnly: boolean }) {
  const missions = [...(event.missions ?? [])]
    .filter((mission: any) => !options.publicOnly || mission.published !== false)
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const itemIds = missions.flatMap((mission: any) =>
    (mission.rewards ?? []).map((reward: any) => reward.itemId),
  );
  const itemMap = await resolveRewardItems(itemIds);

  const hydratedMissions = missions.map((mission: any) => ({
    ...mission,
    deadline: mission.deadline ?? null,
    rewards: (mission.rewards ?? []).map(
      (reward: any): HydratedReward => ({
        itemId: reward.itemId,
        quantity: reward.quantity,
        item: itemMap.get(reward.itemId) ?? null,
      }),
    ),
  }));

  // アイテム別の合計。種類の違うアイテムの個数は合算しない。
  const totals = new Map<string, { itemId: string; quantity: number; item: any | null }>();
  for (const mission of hydratedMissions) {
    for (const reward of mission.rewards) {
      const current = totals.get(reward.itemId);
      if (current) current.quantity += reward.quantity;
      else totals.set(reward.itemId, { itemId: reward.itemId, quantity: reward.quantity, item: reward.item });
    }
  }

  return {
    ...event,
    missions: hydratedMissions,
    rewardTotals: [...totals.values()],
    // 合計の対象範囲（公開画面では公開中のミッションのみ）
    totalsScope: options.publicOnly ? "published-missions" : "all-missions",
    totalsMissionCount: hydratedMissions.length,
  };
}

function toSummary(event: any) {
  const missions = event.missions ?? [];
  return {
    id: event.id,
    name: event.name,
    eventCategory: event.eventCategory,
    description: event.description,
    imageUrl: event.imageUrl,
    startDate: event.startDate,
    endDate: event.endDate,
    published: event.published,
    sortOrder: event.sortOrder,
    missionCount: missions.length,
    publishedMissionCount: missions.filter((mission: any) => mission.published !== false).length,
    updatedAt: event.updatedAt,
  };
}

// ---------------- 公開API（非公開イベント・非公開ミッションは返さない） ----------------

router.get("/event-missions", async (_req, res) => {
  try {
    await connectDB();
    const events = await MissionEvent.find({ published: true })
      .sort({ sortOrder: 1, startDate: -1 })
      .lean();
    return res.json(
      events.map((event) => {
        const summary = toSummary(event);
        return {
          ...summary,
          missionCount: summary.publishedMissionCount,
          published: undefined,
          publishedMissionCount: undefined,
        };
      }),
    );
  } catch (error) {
    console.error("[event-missions] list failed:", error);
    return res.status(500).json({ message: "イベント一覧の取得に失敗しました" });
  }
});

router.get("/event-missions/:id", async (req, res) => {
  try {
    await connectDB();
    const event = await MissionEvent.findOne({ id: req.params.id, published: true }).lean();
    if (!event) return res.status(404).json({ message: "イベントが見つかりません" });
    return res.json(await hydrateEvent(event, { publicOnly: true }));
  } catch (error) {
    console.error("[event-missions] detail failed:", error);
    return res.status(500).json({ message: "イベントの取得に失敗しました" });
  }
});

// ---------------- 管理API ----------------

router.get("/admin/event-missions", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await connectDB();
    const events = await MissionEvent.find().sort({ sortOrder: 1, startDate: -1 }).lean();
    return res.json(events.map(toSummary));
  } catch (error) {
    console.error("[admin/event-missions] list failed:", error);
    return res.status(500).json({ message: "イベント一覧の取得に失敗しました" });
  }
});

router.get("/admin/event-missions/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const event = await MissionEvent.findOne({ id: req.params.id }).lean();
    if (!event) return res.status(404).json({ message: "イベントが見つかりません" });
    return res.json(await hydrateEvent(event, { publicOnly: false }));
  } catch (error) {
    console.error("[admin/event-missions] detail failed:", error);
    return res.status(500).json({ message: "イベントの取得に失敗しました" });
  }
});

router.post("/admin/event-missions", requireAuth, requireAdmin, async (req, res) => {
  const parsed = cleanEventBody(req.body);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  try {
    await connectDB();

    const itemIds = parsed.value.missions.flatMap((mission) => mission.rewards.map((reward) => reward.itemId));
    const check = await validateRewardItemIds(itemIds);
    if (!check.ok) return res.status(400).json({ message: check.message });

    const event = await MissionEvent.create({ ...parsed.value, id: newId("event-mission") });
    return res.status(201).json(await hydrateEvent(event.toObject(), { publicOnly: false }));
  } catch (error) {
    console.error("[admin/event-missions] create failed:", error);
    return res.status(400).json({ message: "イベントを保存できませんでした" });
  }
});

router.put("/admin/event-missions/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = cleanEventBody(req.body);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  try {
    await connectDB();

    const existing = await MissionEvent.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ message: "イベントが見つかりません" });

    // 既にこのイベントが参照しているアイテムは、無効化されていても再保存を許可する
    const allowInactive = new Set<string>(
      (existing.missions ?? []).flatMap((mission: any) =>
        (mission.rewards ?? []).map((reward: any) => reward.itemId as string),
      ),
    );

    const itemIds = parsed.value.missions.flatMap((mission) => mission.rewards.map((reward) => reward.itemId));
    const check = await validateRewardItemIds(itemIds, allowInactive);
    if (!check.ok) return res.status(400).json({ message: check.message });

    const event = await MissionEvent.findOneAndUpdate({ id: req.params.id }, parsed.value, {
      new: true,
      runValidators: true,
    }).lean();
    if (!event) return res.status(404).json({ message: "イベントが見つかりません" });

    return res.json(await hydrateEvent(event, { publicOnly: false }));
  } catch (error) {
    console.error("[admin/event-missions] update failed:", error);
    return res.status(400).json({ message: "イベントを更新できませんでした" });
  }
});

// 公開・非公開の切り替え（安全な非公開化）
router.patch("/admin/event-missions/:id/published", requireAuth, requireAdmin, async (req, res) => {
  if (typeof req.body?.published !== "boolean") {
    return res.status(400).json({ message: "published は true / false で指定してください" });
  }

  try {
    await connectDB();
    const event = await MissionEvent.findOneAndUpdate(
      { id: req.params.id },
      { published: req.body.published },
      { new: true },
    ).lean();
    if (!event) return res.status(404).json({ message: "イベントが見つかりません" });
    return res.json(toSummary(event));
  } catch (error) {
    console.error("[admin/event-missions] publish failed:", error);
    return res.status(500).json({ message: "公開状態の変更に失敗しました" });
  }
});

router.delete("/admin/event-missions/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const result = await MissionEvent.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "イベントが見つかりません" });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[admin/event-missions] delete failed:", error);
    return res.status(500).json({ message: "イベントの削除に失敗しました" });
  }
});

export default router;
