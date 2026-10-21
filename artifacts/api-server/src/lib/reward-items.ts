import { ChallengeRewardItem, Medal } from "@workspace/db";

/**
 * 共通アイテム。実体は2つのコレクションにあり、重複保存はしない。
 *  - storable カテゴリ : ChallengeRewardItem（既存コレクション。category は任意項目・未設定は normal）
 *  - medal             : Medal（メダル本体。名前・画像はメダル側を正とする）
 * 報酬は常に { itemId, quantity } で保存し、表示時にここで解決する。
 *
 * カテゴリは「アイテムの種類の分類」。どの報酬機能で使えるか（チャレバト／イベントミッション）は
 * 別の設定（rewardCategories）で制御する。カテゴリを増やすときは REWARD_CATEGORY_DEFS に1行足す。
 */
export type RewardItemCategory = string;

export type RewardCategoryDef = {
  value: RewardItemCategory;
  label: string;
  /** ChallengeRewardItem に保存できるカテゴリか（メダルは Medal 側が正なので false） */
  storable: boolean;
  /** 個数を持たない（常に1）アイテムか。称号・背景など */
  fixedQuantity: boolean;
};

export const REWARD_CATEGORY_DEFS: RewardCategoryDef[] = [
  { value: "normal", label: "通常アイテム", storable: true, fixedQuantity: false },
  { value: "event", label: "イベントアイテム", storable: true, fixedQuantity: false },
  { value: "medal-material", label: "メダル素材", storable: true, fixedQuantity: false },
  { value: "title", label: "称号", storable: true, fixedQuantity: true },
  { value: "background", label: "背景", storable: true, fixedQuantity: true },
  { value: "medal", label: "メダル", storable: false, fixedQuantity: false },
  { value: "medal-inheritance", label: "メダル継承用アイテム", storable: true, fixedQuantity: false },
];

export const REWARD_ITEM_CATEGORIES: RewardItemCategory[] = REWARD_CATEGORY_DEFS.map((def) => def.value);

export const REWARD_ITEM_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  REWARD_CATEGORY_DEFS.map((def) => [def.value, def.label]),
);

export const STORABLE_CATEGORIES: RewardItemCategory[] = REWARD_CATEGORY_DEFS.filter((def) => def.storable).map(
  (def) => def.value,
);

/** 報酬機能ごとの、新規に選べるカテゴリの初期値 */
export const FEATURE_DEFAULT_CATEGORIES = {
  challengeBattle: ["normal"] as RewardItemCategory[],
  eventMission: ["normal", "event", "medal-material", "title", "background"] as RewardItemCategory[],
};

export function getCategoryDef(category: string): RewardCategoryDef | undefined {
  return REWARD_CATEGORY_DEFS.find((def) => def.value === category);
}

export type ResolvedRewardItem = {
  id: string;
  name: string;
  category: RewardItemCategory;
  categoryLabel: string;
  fixedQuantity: boolean;
  imageUrl: string;
  description: string;
  active: boolean;
  source: "item" | "medal";
};

export function toStoredItem(item: any): ResolvedRewardItem {
  // 既存データ（category なし）や未知の値は「通常アイテム」として扱う
  const def = getCategoryDef(String(item?.category ?? "normal"));
  const resolved = def && def.storable ? def : getCategoryDef("normal")!;
  return {
    id: String(item.id),
    name: String(item.name ?? ""),
    category: resolved.value,
    categoryLabel: resolved.label,
    fixedQuantity: resolved.fixedQuantity,
    imageUrl: String(item.imageUrl ?? ""),
    description: String(item.description ?? ""),
    active: item.active !== false,
    source: "item",
  };
}

export function toMedalItem(medal: any): ResolvedRewardItem {
  const def = getCategoryDef("medal")!;
  return {
    id: String(medal.id),
    name: String(medal.name ?? ""),
    category: def.value,
    categoryLabel: def.label,
    fixedQuantity: def.fixedQuantity,
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
 * 報酬候補に含めるカテゴリの指定を取り出す。未指定は defaults（機能ごとの初期値）。
 * 明示的な空配列（すべてOFF）は、新しい報酬を選べない状態として扱う。
 */
export function parseRewardCategories(
  value: unknown,
  defaults: RewardItemCategory[] = FEATURE_DEFAULT_CATEGORIES.challengeBattle,
): RewardItemCategory[] {
  if (!Array.isArray(value)) return defaults;
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
): Promise<
  { ok: true; resolved: Map<string, ResolvedRewardItem> } | { ok: false; message: string }
> {
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

  return { ok: true, resolved };
}

/** 称号・背景など個数を持たないアイテムは、個数を1に固定する。違反があればメッセージを返す。 */
export function findFixedQuantityViolation(
  rewards: { itemId: string; quantity: number }[],
  resolved: Map<string, ResolvedRewardItem>,
): string | null {
  for (const reward of rewards) {
    const item = resolved.get(reward.itemId);
    if (item?.fixedQuantity && reward.quantity !== 1) {
      return `「${item.name}」（${item.categoryLabel}）の個数は1のみ設定できます`;
    }
  }
  return null;
}
