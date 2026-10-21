import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, LoaderCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import { RewardIcon } from "@/components/reward-icon";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_STYLE,
  ApiError,
  apiRequest,
  formatJst,
  getEventStatus,
} from "@/lib/admin-api";

type RewardItem = {
  id: string;
  name: string;
  imageUrl: string;
  categoryLabel: string;
  fixedQuantity?: boolean;
} | null;
type Reward = { itemId: string; quantity: number; item: RewardItem };

type Mission = {
  id: string;
  name: string;
  condition: string;
  requiredCount: number;
  deadline: string | null;
  rewards: Reward[];
};

type EventDetail = {
  id: string;
  name: string;
  eventCategory: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  missions: Mission[];
  rewardTotals: Reward[];
  totalsMissionCount: number;
};

function RewardChip({ reward }: { reward: Reward }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-secondary/60 p-2.5">
      <RewardIcon imageUrl={reward.item?.imageUrl} name={reward.item?.name} size={40} />
      <div className="min-w-0">
        <p className="break-words text-sm font-bold">{reward.item?.name ?? "登録済みアイテム"}</p>
        {reward.item?.categoryLabel ? (
          <p className="text-[10px] text-muted-foreground">{reward.item.categoryLabel}</p>
        ) : null}
        {/* 称号・背景など個数を持たないアイテムは「× 1」を表示しない */}
        {reward.item?.fixedQuantity ? null : (
          <p className="text-xs font-bold text-primary">× {reward.quantity.toLocaleString("ja-JP")}</p>
        )}
      </div>
    </div>
  );
}

export default function EventMissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const data = await apiRequest<EventDetail>(`/event-missions/${encodeURIComponent(id)}`);
        if (!cancelled) setEvent(data);
      } catch (reason) {
        if (!cancelled) {
          setError(
            reason instanceof ApiError && reason.status === 404
              ? "指定されたイベントが見つからないか、公開されていません。"
              : reason instanceof Error
                ? reason.message
                : "イベントを取得できませんでした",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <GuideShell>
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <LoaderCircle size={18} className="animate-spin" />
          読み込み中…
        </div>
      </GuideShell>
    );
  }

  if (error || !event) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="EVENT MISSIONS / ERROR"
          title="イベントを表示できません"
          description={error}
          action={<Link href="/event-missions" className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-white">一覧に戻る</Link>}
        />
      </GuideShell>
    );
  }

  const status = getEventStatus(event.startDate, event.endDate);
  const now = Date.now();

  return (
    <GuideShell>
      <Link href="/event-missions" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
        <ArrowLeft size={14} />イベント一覧へ
      </Link>

      <PageIntro eyebrow={event.eventCategory.toUpperCase()} title={event.name} />

      {/* 基本情報 */}
      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="mb-4 max-h-64 w-full rounded object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded border px-2.5 py-1 text-xs font-bold ${EVENT_STATUS_STYLE[status]}`}>{EVENT_STATUS_LABEL[status]}</span>
          <span className="inline-flex items-start gap-1 text-xs text-muted-foreground">
            <CalendarDays size={14} className="mt-0.5 shrink-0" />
            {formatJst(event.startDate)} 〜 {formatJst(event.endDate)}
          </span>
        </div>
        {event.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{event.description}</p> : null}
      </section>

      {/* 報酬合計 */}
      {event.rewardTotals.length > 0 ? (
        <section className="mt-8" data-testid="section-event-reward-totals">
          <h2 className="mb-1 text-xl font-black">報酬の合計</h2>
          <p className="mb-3 text-xs text-muted-foreground">対象：このイベントの全{event.totalsMissionCount}ミッションの報酬（アイテム別）</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {event.rewardTotals.map((reward) => (
              <RewardChip key={reward.itemId} reward={reward} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ミッション一覧 */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">ミッション一覧</h2>
        {event.missions.length === 0 ? (
          <p className="rounded-md border border-card-border bg-card p-4 text-sm text-muted-foreground">公開中のミッションはまだありません。</p>
        ) : (
          <div className="space-y-4">
            {event.missions.map((mission, index) => {
              const closed = mission.deadline ? now > new Date(mission.deadline).getTime() : false;
              return (
                <article key={mission.id} className="rounded-md border border-card-border bg-card p-5 shadow-card" data-testid={`card-mission-${mission.id}`}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      {mission.name ? <h3 className="break-words text-base font-black">{mission.name}</h3> : null}
                      {mission.condition ? (
                        <p className={`whitespace-pre-wrap break-words text-sm leading-6 ${mission.name ? "mt-1" : "font-bold"}`}>{mission.condition}</p>
                      ) : null}
                      {/* 旧データに期限・達成数が残っている場合のみ表示（現在は入力不要の項目） */}
                      {mission.deadline ? (
                        <p className={`mt-1 text-xs ${closed ? "text-muted-foreground" : "font-bold"}`}>
                          {closed ? "受付終了" : "期限"}：{formatJst(mission.deadline)}
                        </p>
                      ) : null}
                      {mission.requiredCount > 1 ? (
                        <p className="mt-1 text-xs text-muted-foreground">必要な達成数：{mission.requiredCount.toLocaleString("ja-JP")}</p>
                      ) : null}
                    </div>
                  </div>

                  {mission.rewards.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-black">報酬</h4>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {mission.rewards.map((reward, rewardIndex) => (
                          <RewardChip key={`${reward.itemId}-${rewardIndex}`} reward={reward} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </GuideShell>
  );
}
