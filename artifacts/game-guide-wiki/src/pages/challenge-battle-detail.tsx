import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Gift, LoaderCircle, Swords } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

type RewardItem = {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
};

type Reward = {
  itemId: string;
  quantity: number;
  item?: RewardItem | null;
};

type ScoreReward = {
  score: number;
  normalRewards: Reward[];
  passRewards: Reward[];
};

type Battle = {
  id: string;
  name: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  overview: string;
  rules: string;
  scoreRewards: ScoreReward[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時未設定";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(battle: Battle) {
  const now = Date.now();
  const start = new Date(battle.startDate).getTime();
  const end = new Date(battle.endDate).getTime();

  if (now < start) return { label: "開催予定", style: "border-yellow-200 bg-yellow-50 text-yellow-700" };
  if (now <= end) return { label: "開催中", style: "border-red-200 bg-red-50 text-red-700" };
  return { label: "終了", style: "border-gray-200 bg-gray-100 text-gray-600" };
}

function RewardList({ title, rewards }: { title: string; rewards: Reward[] }) {
  return (
    <div className="rounded-md border border-card-border bg-card p-4">
      <h4 className="mb-3 text-sm font-black">{title}</h4>
      {rewards.length === 0 ? (
        <p className="text-xs text-muted-foreground">報酬なし</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rewards.map((reward, index) => (
            <div
              key={`${reward.itemId}-${index}`}
              className="flex min-w-0 items-center gap-3 rounded-md bg-secondary/60 p-3"
            >
              {reward.item?.imageUrl ? (
                <img
                  src={reward.item.imageUrl}
                  alt={reward.item.name}
                  className="h-12 w-12 shrink-0 rounded object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-background text-muted-foreground">
                  <Gift size={20} />
                </div>
              )}
              <div className="min-w-0">
                <p className="break-words text-sm font-bold">
                  {reward.item?.name ?? "登録済みアイテム"}
                </p>
                <p className="mt-1 text-xs font-bold text-primary">
                  × {reward.quantity.toLocaleString("ja-JP")}
                </p>
                {reward.item?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reward.item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RewardTotals({ title, scoreRewards, field }: {
  title: string;
  scoreRewards: ScoreReward[];
  field: "normalRewards" | "passRewards";
}) {
  const totals = new Map<string, { item: RewardItem | null | undefined; quantity: number }>();

  for (const tier of scoreRewards) {
    for (const reward of tier[field] ?? []) {
      const current = totals.get(reward.itemId);
      totals.set(reward.itemId, {
        item: reward.item ?? current?.item,
        quantity: (current?.quantity ?? 0) + reward.quantity,
      });
    }
  }

  const entries = [...totals.entries()].sort((a, b) =>
    (a[1].item?.name ?? a[0]).localeCompare(b[1].item?.name ?? b[0], "ja"),
  );

  return (
    <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
      <h3 className="mb-4 text-base font-black">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">報酬は登録されていません。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([itemId, entry]) => (
            <div key={itemId} className="flex items-center gap-3 rounded-md bg-secondary/60 p-3">
              {entry.item?.imageUrl ? (
                <img
                  src={entry.item.imageUrl}
                  alt={entry.item.name}
                  className="h-10 w-10 shrink-0 rounded object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-background">
                  <Gift size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="break-words text-sm font-bold">
                  {entry.item?.name ?? "登録済みアイテム"}
                </p>
                <p className="text-xs font-bold text-primary">
                  合計 × {entry.quantity.toLocaleString("ja-JP")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ChallengeBattleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/challenge-battles/${encodeURIComponent(id ?? "")}`,
        );
        if (response.status === 404) throw new Error("このチャレバトは見つかりません。");
        if (!response.ok) throw new Error("チャレバトの詳細を取得できませんでした。");

        const data = (await response.json()) as Battle;
        if (!cancelled) setBattle(data);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "読み込みに失敗しました。");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <GuideShell>
        <PageIntro eyebrow="CHALLENGE BATTLE" title="読み込み中" description="チャレバトの詳細を取得しています。" />
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <LoaderCircle size={18} className="animate-spin" />
          読み込み中…
        </div>
      </GuideShell>
    );
  }

  if (error || !battle) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="CHALLENGE BATTLE / ERROR"
          title="チャレバトを表示できません"
          description={error || "指定されたチャレバトが見つかりません。"}
          action={
            <Link href="/challenge-battles" className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-white">
              一覧に戻る
            </Link>
          }
        />
      </GuideShell>
    );
  }

  const status = getStatus(battle);
  const scoreRewards = [...(battle.scoreRewards ?? [])].sort((a, b) => a.score - b.score);

  return (
    <GuideShell>
      <Link
        href="/challenge-battles"
        className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        チャレバト一覧に戻る
      </Link>

      <PageIntro
        eyebrow="CHALLENGE BATTLE"
        title={battle.name}
        description={battle.overview || "チャレンジバトルの開催情報と報酬一覧です。"}
      />
            {battle.bannerImageUrl ? (
        <div className="mb-6 overflow-hidden rounded-lg border border-card-border bg-card shadow-card">
          <img
            src={battle.bannerImageUrl}
            alt={`${battle.name}のバナー`}
            className="aspect-[16/9] w-full object-contain bg-black/5"
          />
        </div>
      ) : null}

      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        <div className="mb-4">
          <span className={`inline-flex rounded-sm border px-2 py-1 text-xs font-bold ${status.style}`}>
            {status.label}
          </span>
        </div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-muted-foreground">
          <CalendarDays size={16} />
          開催期間
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-secondary p-4">
            <p className="mb-1 text-xs text-muted-foreground">開始日時</p>
            <p className="text-sm font-bold">{formatDate(battle.startDate)}</p>
          </div>
          <div className="rounded-md bg-secondary p-4">
            <p className="mb-1 text-xs text-muted-foreground">終了日時</p>
            <p className="text-sm font-bold">{formatDate(battle.endDate)}</p>
          </div>
        </div>
      </section>

      {battle.rules && (
        <section className="mt-6 rounded-md border border-card-border bg-card p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-base font-black">
            <Swords size={18} />
            ルール
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{battle.rules}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-4 text-xl font-black">スコア報酬</h2>
        {scoreRewards.length === 0 ? (
          <div className="rounded-md border border-card-border bg-card p-6 text-sm text-muted-foreground">
            スコア報酬はまだ登録されていません。
          </div>
        ) : (
          <div className="space-y-5">
            {scoreRewards.map((tier, index) => (
              <section key={`${tier.score}-${index}`} className="rounded-md border border-card-border bg-card p-5 shadow-card">
                <h3 className="mb-4 text-lg font-black">
                  {tier.score.toLocaleString("ja-JP")} スコア
                </h3>
                <div className="grid gap-4 xl:grid-cols-2">
                  <RewardList title="通常報酬" rewards={tier.normalRewards ?? []} />
                  <RewardList title="パス報酬" rewards={tier.passRewards ?? []} />
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black">報酬の合計</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <RewardTotals title="通常報酬の合計" scoreRewards={scoreRewards} field="normalRewards" />
          <RewardTotals title="パス報酬の合計" scoreRewards={scoreRewards} field="passRewards" />
        </div>
      </section>
    </GuideShell>
  );
}
