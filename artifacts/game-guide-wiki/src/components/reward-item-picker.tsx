import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { categoryLabel, type RewardCategoryInfo, type RewardItemOption } from "@/lib/reward-items";

/**
 * 共通アイテムマスターから報酬アイテムを選ぶ（検索＋カテゴリ絞り込み）。
 * allowedCategories：この報酬機能で新しく選べるカテゴリ（設定でONのもの）。
 * 既に選択済みのアイテムは、無効化・選択対象外のカテゴリでも選択肢に残す（既存の報酬を壊さないため）。
 */
export function RewardItemPicker({
  items,
  categories,
  allowedCategories,
  value,
  onChange,
  testId,
}: {
  items: RewardItemOption[];
  categories: RewardCategoryInfo[];
  allowedCategories: string[];
  value: string;
  onChange: (itemId: string) => void;
  testId?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filterCategories = categories.filter((info) => allowedCategories.includes(info.value));

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.id === value) return true;
      if (!item.active) return false;
      if (!allowedCategories.includes(item.category)) return false;
      if (category !== "all" && item.category !== category) return false;
      return !q || item.name.toLowerCase().includes(q);
    });
  }, [items, query, category, value, allowedCategories]);

  const selected = items.find((item) => item.id === value);
  const selectedOutOfScope = selected && (!selected.active || !allowedCategories.includes(selected.category));

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
          onChange={(event) => setCategory(event.target.value)}
          className="max-w-[45%] rounded border border-border bg-background px-2 py-1.5 text-xs"
          aria-label="カテゴリで絞り込み"
        >
          <option value="all">すべて</option>
          {filterCategories.map((info) => (
            <option key={info.value} value={info.value}>
              {info.label}
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
            [{categoryLabel(categories, item.category)}] {item.name}
            {!item.active
              ? "（無効）"
              : !allowedCategories.includes(item.category)
                ? "（現在の設定では新規選択対象外）"
                : ""}
          </option>
        ))}
      </select>

      {selectedOutOfScope && selected?.active ? (
        <p className="text-[11px] text-muted-foreground">
          このアイテムは既存の報酬です。現在の設定では新しく選べないカテゴリですが、そのまま維持されます。
        </p>
      ) : null}
      {value && !selected ? (
        <p className="text-[11px] text-red-600">選択中のアイテムが見つかりません（削除された可能性があります）</p>
      ) : null}
    </div>
  );
}
