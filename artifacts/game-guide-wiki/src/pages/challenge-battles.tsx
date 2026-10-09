import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Swords } from "lucide-react";
import { Link } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

type Battle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  overview: string;
  rules: string;
};

function getStatus(battle: Battle) {
  const now = Date.now();
  const start = new Date(battle.startDate).getTime();
  const end = new Date(battle.endDate).getTime();

  if (now < start) return { label: "開催予定", style: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  if (now <= end) return { label: "開催中", style: "bg-red-50 text-red-700 border-red-200" };
  return { label: "終了", style: "bg-gray-100 text-gray-600 border-gray-200" };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時未設定";
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export default function ChallengeBattlesPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/challenge-battles`);
        if (!response.ok) throw new Error("チャレバト一覧を取得できませんでした");
        const data = (await response.json()) as Battle[];
        if (!cancelled) setBattles(data);
      } catch {
        if (!cancelled) setError("一覧を読み込めませんでした。時間をおいて再度お試しください。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GuideShell>
      <PageIntro
        eyebrow="CHALLENGE BATTLE"
        title="チャレンジバトル"
        description="開催情報・ルール・スコア報酬を確認できます。終了したチャレバトも閲覧できます。"
      />

      {loading ? (
        <div className="rounded-md border border-card-border bg-card p-8 text-center text-sm text-muted-foreground">
          チャレバトを読み込んでいます…
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : battles.length === 0 ? (
        <div className="rounded-md border border-card-border bg-card p-8 text-center">
          <Swords className="mx-auto mb-3 text-muted-foreground" size={32} />
          <h2 className="font-black">チャレバトはまだ登録されていません</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            新しいチャレンジバトルが登録されると、ここに表示されます。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {battles.map((battle) => {
            const status = getStatus(battle);
            return (
              <Link
                key={battle.id}
                href={`/challenge-battles/${encodeURIComponent(battle.id)}`}
                className="group rounded-lg border border-card-border bg-card p-5 shadow-card transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-sm border px-2 py-1 text-xs font-bold ${status.style}`}>
                    {status.label}
                  </span>
                  <ArrowRight size={18} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <Swords size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black">{battle.name}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {battle.overview || "イベントの詳細・ルール・スコア報酬を確認できます。"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <CalendarDays size={15} />
                  <span>{formatDate(battle.startDate)} ～ {formatDate(battle.endDate)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </GuideShell>
  );
}
