export type RewardItemCategory = "normal" | "medal" | "medal-inheritance";

export const REWARD_CATEGORY_LABELS: Record<RewardItemCategory, string> = {
  normal: "通常アイテム",
  medal: "メダル",
  "medal-inheritance": "メダル継承用アイテム",
};

export const REWARD_CATEGORIES: RewardItemCategory[] = ["normal", "medal", "medal-inheritance"];

export type RewardItemOption = {
  id: string;
  name: string;
  category: RewardItemCategory;
  categoryLabel: string;
  imageUrl: string;
  description: string;
  active: boolean;
  source: "item" | "medal";
};

export type RewardRow = { itemId: string; quantity: number | "" };

/** アイテム別に個数を合算する。種類の違うアイテムは1つの数値にまとめない。 */
export function aggregateRewards(
  rows: RewardRow[],
): { itemId: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const quantity = typeof row.quantity === "number" ? row.quantity : 0;
    if (!row.itemId || quantity <= 0) continue;
    totals.set(row.itemId, (totals.get(row.itemId) ?? 0) + quantity);
  }
  return [...totals.entries()].map(([itemId, quantity]) => ({ itemId, quantity }));
}
