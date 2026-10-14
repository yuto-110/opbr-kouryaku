import { Check, Monitor, Moon, Sun } from "lucide-react";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "ライトモード",
    description: "明るい背景で表示します。",
    icon: Sun,
  },
  {
    value: "dark",
    label: "ダークモード",
    description: "暗い背景で表示します。",
    icon: Moon,
  },
  {
    value: "system",
    label: "システム設定に合わせる",
    description: "端末やOSのライト・ダーク設定に合わせて自動で切り替えます。",
    icon: Monitor,
  },
];

export default function SettingsPage() {
  const current = useThemePreference();

  return (
    <GuideShell>
      <PageIntro
        eyebrow="SETTINGS"
        title="設定"
        description="サイトの表示に関する設定です。この端末のブラウザに保存されます。"
      />

      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-1 text-base font-black">テーマ</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          サイト全体の配色を選択できます。
        </p>

        <div
          role="radiogroup"
          aria-label="テーマ"
          className="grid gap-3 sm:grid-cols-3"
        >
          {THEME_OPTIONS.map((option) => {
            const selected = current === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setThemePreference(option.value)}
                data-testid={`button-theme-${option.value}`}
                className={`flex min-h-[88px] items-start gap-3 rounded-md border p-4 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <Icon
                  size={20}
                  className={selected ? "text-primary" : "text-muted-foreground"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                {selected && (
                  <Check size={18} className="shrink-0 text-primary" aria-label="選択中" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    </GuideShell>
  );
}
