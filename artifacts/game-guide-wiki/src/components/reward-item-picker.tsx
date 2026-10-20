import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  type RewardItemCategory,
  type RewardItemOption,
} from "@/lib/reward-items";

/**
 * 共通アイテムマスターから報酬アイテムを選ぶ（検索＋カテゴリ絞り込み）。
 * 既に選択済みのアイテムは、無効化されていても選択肢に残す（過去の報酬を表示・再保存できるように）。
 */
export function RewardItemPicker({
  items,
  value,
  onChange,
  testId,
}: {
  items: RewardItemOption[];
  value: string;
  onChange: (itemId: string) => void;
  testId?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | RewardItemCategory>("all");

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.id === value) return true;
      if (!item.active) return false;
      if (category !== "all" && item.category !== category) return false;
      return !q || item.name.toLowerCase().includes(q);
    });
  }, [items, query, category, value]);

  const selected = items.find((item) => item.id === value);

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex gap-1.5">
        <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-border bg-background px-2">
          <Search size={13} className="shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="アイテム検索"
            className="w-full min-w-0 bg-transparent py-1.5 text-xs outline-none"
            aria-label="アイテム検索"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | RewardItemCategory)}
          className="rounded border border-border bg-background px-2 py-1.5 text-xs"
          aria-label="カテゴリで絞り込み"
        >
          <option value="all">すべて</option>
          {REWARD_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {REWARD_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-border bg-background px-2 py-2 text-sm"
        data-testid={testId}
      >
        <option value="">アイテムを選択</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            [{REWARD_CATEGORY_LABELS[item.category]}] {item.name}
            {item.active ? "" : "（無効）"}
          </option>
        ))}
      </select>

      {value && !selected ? (
        <p className="text-[11px] text-red-600">選択中のアイテムが見つかりません（削除された可能性があります）</p>
      ) : null}
    </div>
  );
}
