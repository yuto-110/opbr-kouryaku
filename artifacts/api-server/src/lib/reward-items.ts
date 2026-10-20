import { ChallengeRewardItem, Medal } from "@workspace/db";

/**
 * 共通アイテム。実体は2つのコレクションにあり、重複保存はしない。
 *  - normal / medal-inheritance : ChallengeRewardItem（既存コレクション。category は任意項目）
 *  - medal                      : Medal（メダル本体。名前・画像はメダル側を正とする）
 * 報酬は常に { itemId, quantity } で保存し、表示時にここで解決する。
 */
export type RewardItemCategory = "normal" | "medal" | "medal-inheritance";

export const REWARD_ITEM_CATEGORIES: RewardItemCategory[] = [
  "normal",
  "medal",
  "medal-inheritance",
];

export const REWARD_ITEM_CATEGORY_LABELS: Record<RewardItemCategory, string> = {
  normal: "通常アイテム",
  medal: "メダル",
  "medal-inheritance": "メダル継承用アイテム",
};

export type ResolvedRewardItem = {
  id: string;
  name: string;
  category: RewardItemCategory;
  categoryLabel: string;
  imageUrl: string;
  description: string;
  active: boolean;
  source: "item" | "medal";
};

export function toStoredItem(item: any): ResolvedRewardItem {
  const category: RewardItemCategory =
    item?.category === "medal-inheritance" ? "medal-inheritance" : "normal";
  return {
    id: String(item.id),
    name: String(item.name ?? ""),
    category,
    categoryLabel: REWARD_ITEM_CATEGORY_LABELS[category],
    imageUrl: String(item.imageUrl ?? ""),
    description: String(item.description ?? ""),
    active: item.active !== false,
    source: "item",
  };
}

export function toMedalItem(medal: any): ResolvedRewardItem {
  return {
    id: String(medal.id),
    name: String(medal.name ?? ""),
    category: "medal",
    categoryLabel: REWARD_ITEM_CATEGORY_LABELS.medal,
    imageUrl: String(medal.imageUrl ?? ""),
    description: "",
    active: medal.active !== false,
    source: "medal",
  };
}

/** id から共通アイテムを解決する。無効化されたアイテムも解決できる（過去の報酬を表示するため）。 */
export async function resolveRewardItems(
  ids: Iterable<string>,
): Promise<Map<string, ResolvedRewardItem>> {
  const unique = [...new Set([...ids].filter(Boolean))];
  const result = new Map<string, ResolvedRewardItem>();
  if (unique.length === 0) return result;

  const [items, medals] = await Promise.all([
    ChallengeRewardItem.find({ id: { $in: unique } }).lean(),
    Medal.find({ id: { $in: unique } }).select("id name imageUrl active").lean(),
  ]);

  for (const item of items) result.set(item.id, toStoredItem(item));
  for (const medal of medals) {
    if (!result.has(medal.id)) result.set(medal.id, toMedalItem(medal));
  }
  return result;
}

/**
 * 報酬候補に含めるカテゴリの指定を取り出す。未指定は「通常アイテムのみ」。
 * 明示的な空配列（すべてOFF）は、新しい報酬を選べない状態として扱う。
 */
export function parseRewardCategories(value: unknown): RewardItemCategory[] {
  if (!Array.isArray(value)) return ["normal"];
  return REWARD_ITEM_CATEGORIES.filter((category) => value.includes(category));
}

/**
 * 保存時の参照チェック。存在しない id は常に不可。
 * existing（そのデータが既に参照している id）は、無効化済み・選択対象外カテゴリでも再保存できる。
 * → 既存の報酬は、アイテムの無効化やカテゴリ設定の変更で消えたり保存不能になったりしない。
 * allowedCategories を渡した場合、existing 以外のアイテムはそのカテゴリのものだけ選べる。
 */
export async function validateRewardItemIds(
  ids: string[],
  existing: Set<string> = new Set(),
  allowedCategories?: RewardItemCategory[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const unique = [...new Set(ids)];
  if (unique.some((id) => !id)) {
    return { ok: false, message: "報酬アイテムを選択してください" };
  }

  const resolved = await resolveRewardItems(unique);

  const missing = unique.filter((id) => !resolved.has(id));
  if (missing.length > 0) {
    return { ok: false, message: "存在しない報酬アイテムが含まれています" };
  }

  const inactive = unique.filter(
    (id) => resolved.get(id)?.active === false && !existing.has(id),
  );
  if (inactive.length > 0) {
    const names = inactive.map((id) => resolved.get(id)?.name ?? id).join("、");
    return {
      ok: false,
      message: `無効化されているアイテムは新しく選択できません：${names}`,
    };
  }

  if (allowedCategories) {
    const notAllowed = unique.filter((id) => {
      const item = resolved.get(id);
      return item && !existing.has(id) && !allowedCategories.includes(item.category);
    });
    if (notAllowed.length > 0) {
      const names = notAllowed
        .map((id) => {
          const item = resolved.get(id);
          return `${item?.name ?? id}（${item?.categoryLabel ?? ""}）`;
        })
        .join("、");
      return {
        ok: false,
        message: `現在の設定では報酬に選べない種類のアイテムです：${names}`,
      };
    }
  }

  return { ok: true };
}
