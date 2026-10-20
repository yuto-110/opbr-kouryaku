import { useEffect, useMemo, useState } from "react";
import { CalendarDays, LoaderCircle } from "lucide-react";
import { Link } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import { RewardIcon } from "@/components/reward-icon";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_STYLE,
  apiRequest,
  formatJst,
  getEventStatus,
  type EventStatus,
} from "@/lib/admin-api";

type EventSummary = {
  id: string;
  name: string;
  eventCategory: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  missionCount: number;
};

const SECTIONS: { status: EventStatus; title: string }[] = [
  { status: "ongoing", title: "開催中" },
  { status: "upcoming", title: "開催予定" },
  { status: "ended", title: "終了済み" },
];

export default function EventMissionsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<EventSummary[]>("/event-missions");
        if (!cancelled) setEvents(data);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "イベントを取得できませんでした");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const now = Date.now();
    return SECTIONS.map((section) => ({
      ...section,
      events: events.filter((event) => getEventStatus(event.startDate, event.endDate, now) === section.status),
    }));
  }, [events]);

  return (
    <GuideShell>
      <PageIntro
        eyebrow="EVENT MISSIONS"
        title="イベントミッション"
        description="期間限定イベントのミッションと報酬を確認できます。終了したイベントも閲覧できます。"
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <LoaderCircle size={18} className="animate-spin" />
          読み込み中…
        </div>
      ) : error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : events.length === 0 ? (
        <p className="rounded-md border border-card-border bg-card p-6 text-sm text-muted-foreground">公開中のイベントはまだありません。</p>
      ) : (
        grouped
          .filter((section) => section.events.length > 0)
          .map((section) => (
            <section key={section.status} className="mb-8">
              <h2 className="mb-3 text-lg font-black">{section.title}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {section.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/event-missions/${event.id}`}
                    className="group flex gap-3 rounded-md border border-card-border bg-card p-3 shadow-card transition hover:border-primary/40"
                    data-testid={`card-event-mission-${event.id}`}
                  >
                    <RewardIcon imageUrl={event.imageUrl} name={event.name} size={72} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${EVENT_STATUS_STYLE[section.status]}`}>
                          {EVENT_STATUS_LABEL[section.status]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{event.eventCategory}</span>
                      </div>
                      <h3 className="break-words text-sm font-black group-hover:text-primary">{event.name}</h3>
                      <p className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays size={12} className="mt-0.5 shrink-0" />
                        <span>{formatJst(event.startDate)} 〜 {formatJst(event.endDate)}</span>
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">ミッション {event.missionCount}件</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
      )}
    </GuideShell>
  );
}
