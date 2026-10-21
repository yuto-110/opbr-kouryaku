/**
 * 共通アイテムのカテゴリ。正式な定義はAPI（/admin/reward-items の categories）が持ち、
 * 画面はそれを元に選択肢を作る。下の FALLBACK は、API応答が届く前の表示用の控え。
 * カテゴリを増やすときはAPI側の定義に1行足せば、画面にも反映される。
 */
export type RewardItemCategory = string;

export type RewardCategoryInfo = {
  value: RewardItemCategory;
  label: string;
  /** 共通アイテム管理で登録・編集できるか（メダルはメダル管理が正なので false） */
  storable: boolean;
  /** 個数を持たない（常に1）カテゴリ。称号・背景など */
  fixedQuantity: boolean;
};

export const FALLBACK_CATEGORIES: RewardCategoryInfo[] = [
  { value: "normal", label: "通常アイテム", storable: true, fixedQuantity: false },
  { value: "event", label: "イベントアイテム", storable: true, fixedQuantity: false },
  { value: "medal-material", label: "メダル素材", storable: true, fixedQuantity: false },
  { value: "title", label: "称号", storable: true, fixedQuantity: true },
  { value: "background", label: "背景", storable: true, fixedQuantity: true },
  { value: "medal", label: "メダル", storable: false, fixedQuantity: false },
  { value: "medal-inheritance", label: "メダル継承用アイテム", storable: true, fixedQuantity: false },
];

export type RewardItemOption = {
  id: string;
  name: string;
  category: RewardItemCategory;
  categoryLabel: string;
  fixedQuantity?: boolean;
  imageUrl: string;
  description: string;
  active: boolean;
  source: "item" | "medal";
};

export type RewardItemsResponse = {
  categories: RewardCategoryInfo[];
  featureDefaults: { challengeBattle: RewardItemCategory[]; eventMission: RewardItemCategory[] };
  items: RewardItemOption[];
};

export const FALLBACK_FEATURE_DEFAULTS: RewardItemsResponse["featureDefaults"] = {
  challengeBattle: ["normal"],
  eventMission: ["normal", "event", "medal-material", "title", "background"],
};

export function categoryLabel(categories: RewardCategoryInfo[], value: string): string {
  return categories.find((category) => category.value === value)?.label ?? value;
}

export type RewardRow = { itemId: string; quantity: number | "" };

/** アイテム別に個数を合算する。種類の違うアイテムは1つの数値にまとめない。 */
export function aggregateRewards(
  rows: RewardRow[],
  fixedQuantityIds: ReadonlySet<string> = new Set(),
): { itemId: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const quantity = typeof row.quantity === "number" ? row.quantity : 0;
    if (!row.itemId || quantity <= 0) continue;
    // 称号・背景など個数を持たないアイテムは、何件あっても1
    totals.set(
      row.itemId,
      fixedQuantityIds.has(row.itemId) ? 1 : (totals.get(row.itemId) ?? 0) + quantity,
    );
  }
  return [...totals.entries()].map(([itemId, quantity]) => ({ itemId, quantity }));
}
