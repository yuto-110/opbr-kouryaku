import type { RewardCategoryInfo } from "@/lib/reward-items";

/** 「報酬候補に含めるカテゴリ」のON/OFF設定（チャレバト・イベントミッション共通の部品） */
export function RewardCategorySettings({
  title = "報酬候補に含めるアイテムの種類",
  scopeNote,
  categories,
  value,
  onToggle,
  testIdPrefix,
}: {
  title?: string;
  scopeNote: string;
  categories: RewardCategoryInfo[];
  value: string[];
  onToggle: (category: string) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="rounded-md border border-card-border bg-background p-4" data-testid={`section-${testIdPrefix}`}>
      <h3 className="mb-1 text-sm font-black">{title}</h3>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">{scopeNote}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {categories.map((category) => (
          <label key={category.value} className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={value.includes(category.value)}
              onChange={() => onToggle(category.value)}
              data-testid={`checkbox-${testIdPrefix}-${category.value}`}
            />
            {category.label}
          </label>
        ))}
      </div>
    </div>
  );
}
