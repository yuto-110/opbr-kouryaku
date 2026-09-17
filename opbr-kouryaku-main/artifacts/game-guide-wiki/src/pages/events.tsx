import { Calendar, Clock, Gift, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { events, getEventStatus, type GameEvent, type EventStatus } from '@/data/mockData';
import { GuideShell, PageIntro, SidebarCard } from '@/components/guide-shell';

type EventType = 'all' | 'gacha' | 'challenge-battle' | 'mission' | 'campaign' | 'other';

export default function EventsPage() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EventType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | EventStatus>('all');

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchesQuery = event.name.toLowerCase().includes(query.toLowerCase()) || event.overview.toLowerCase().includes(query.toLowerCase());
      const matchesType = selectedType === 'all' || event.type === selectedType;
      const status = getEventStatus(event);
      const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [query, selectedType, selectedStatus]);

  // イベントをステータスごとにグループ化
  const ongoingEvents = filtered.filter((e) => getEventStatus(e) === 'ongoing');
  const scheduledEvents = filtered.filter((e) => getEventStatus(e) === 'scheduled');
  const endedEvents = filtered.filter((e) => getEventStatus(e) === 'ended');

  return (
    <GuideShell>
      <PageIntro
        eyebrow="EVENT DATABASE"
        title="イベント"
        description="期間限定イベント、チャレンジバトル、ガチャなど。現在開催中のイベントから開催予定のイベントまでをチェック！"
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          {/* 検索・フィルター */}
          <div className="rounded-md border border-card-border bg-card p-3 shadow-card">
            <label className="flex items-center gap-2">
              <Search size={16} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="イベント名や説明を検索"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                data-testid="input-event-search"
              />
            </label>
          </div>

          {/* 開催中イベント */}
          {ongoingEvents.length > 0 && (
            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-lg font-black">🔴 開催中のイベント</h2>
                <p className="text-xs text-muted-foreground">今すぐ参加できるイベント</p>
              </div>
              <div className="grid gap-3">
                {ongoingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* 開催予定イベント */}
          {scheduledEvents.length > 0 && (
            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-lg font-black">🟡 開催予定のイベント</h2>
                <p className="text-xs text-muted-foreground">もうすぐ開始するイベント</p>
              </div>
              <div className="grid gap-3">
                {scheduledEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* 終了したイベント */}
          {endedEvents.length > 0 && (
            <section className="mt-6">
              <details className="rounded-md border border-card-border bg-card shadow-card">
                <summary className="cursor-pointer select-none p-4 font-bold hover:bg-secondary">
                  ⚫ 終了したイベント ({endedEvents.length})
                </summary>
                <div className="border-t border-card-border p-4">
                  <div className="grid gap-3">
                    {endedEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              </details>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="mt-6 rounded-md border border-dashed border-border bg-card py-16 text-center">
              <p className="text-sm font-bold text-muted-foreground">検索結果が見つかりません</p>
            </div>
          )}
        </div>

        {/* サイドバー */}
        <aside className="space-y-4">
          <SidebarCard title="イベント種別">
            <div className="space-y-2">
              <FilterButton
                label="すべて"
                value="all"
                selected={selectedType === 'all'}
                onClick={() => setSelectedType('all')}
              />
              <FilterButton
                label="ガチャ"
                value="gacha"
                selected={selectedType === 'gacha'}
                onClick={() => setSelectedType('gacha')}
              />
              <FilterButton
                label="チャレンジバトル"
                value="challenge-battle"
                selected={selectedType === 'challenge-battle'}
                onClick={() => setSelectedType('challenge-battle')}
              />
              <FilterButton
                label="ミッション"
                value="mission"
                selected={selectedType === 'mission'}
                onClick={() => setSelectedType('mission')}
              />
              <FilterButton
                label="キャンペーン"
                value="campaign"
                selected={selectedType === 'campaign'}
                onClick={() => setSelectedType('campaign')}
              />
            </div>
          </SidebarCard>

          <SidebarCard title="ステータス">
            <div className="space-y-2">
              <FilterButton
                label="すべて"
                value="all"
                selected={selectedStatus === 'all'}
                onClick={() => setSelectedStatus('all')}
              />
              <FilterButton
                label="開催中"
                value="ongoing"
                selected={selectedStatus === 'ongoing'}
                onClick={() => setSelectedStatus('ongoing')}
              />
              <FilterButton
                label="開催予定"
                value="scheduled"
                selected={selectedStatus === 'scheduled'}
                onClick={() => setSelectedStatus('scheduled')}
              />
              <FilterButton
                label="終了"
                value="ended"
                selected={selectedStatus === 'ended'}
                onClick={() => setSelectedStatus('ended')}
              />
            </div>
          </SidebarCard>

          <SidebarCard title="イベント情報">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>📌 開催中のイベントは赤色で表示されます</p>
              <p>📌 開催予定のイベントは黄色で表示されます</p>
              <p>📌 終了したイベントは詳細セクションから確認できます</p>
            </div>
          </SidebarCard>
        </aside>
      </div>
    </GuideShell>
  );
}

function EventCard({ event }: { event: GameEvent }) {
  const status = getEventStatus(event);
  const statusLabel = status === 'ongoing' ? '開催中' : status === 'scheduled' ? '開催予定' : '終了';
  const statusColor = status === 'ongoing' ? 'bg-red-50 border-red-200' : status === 'scheduled' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';
  const statusTextColor = status === 'ongoing' ? 'text-red-700' : status === 'scheduled' ? 'text-yellow-700' : 'text-gray-700';

  const startDate = event.startDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  const endDate = event.endDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  return (
    <Link href={`/events/${event.id}`} className="interactive-card group rounded-md border border-card-border bg-card p-4 shadow-card transition hover:shadow-lg" data-testid={`card-event-${event.id}`}>
      <div className="flex gap-4">
        {/* イベントカラーブロック */}
        <div className="h-[120px] w-[100px] shrink-0 rounded-md" style={{ backgroundColor: event.color, opacity: 0.2 }}>
          <div className="flex h-full items-center justify-center">
            <span className="text-3xl">
              {event.type === 'gacha' ? '🎰' : event.type === 'challenge-battle' ? '⚔️' : event.type === 'mission' ? '📋' : event.type === 'campaign' ? '🎉' : '📅'}
            </span>
          </div>
        </div>

        {/* イベント情報 */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold ${statusColor} ${statusTextColor}`}>
              {statusLabel}
            </span>
            <span className="inline-flex items-center rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">
              {event.type === 'gacha' && 'ガチャ'}
              {event.type === 'challenge-battle' && 'チャレンジバトル'}
              {event.type === 'mission' && 'ミッション'}
              {event.type === 'campaign' && 'キャンペーン'}
              {event.type === 'other' && 'その他'}
            </span>
          </div>

          <h3 className="mb-2 font-bold text-foreground group-hover:text-primary">{event.name}</h3>

          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{event.overview}</p>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              {startDate} ～ {endDate}
            </div>
            {event.rewards.length > 0 && (
              <div className="flex items-center gap-1">
                <Gift size={12} />
                報酬 {event.rewards.length} 種類
              </div>
            )}
          </div>
        </div>

        {/* ステータスバー */}
        <div className="flex shrink-0 flex-col items-center justify-center">
          {status === 'ongoing' && (
            <>
              <div className="h-10 w-1 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-red-600 mt-1">進行中</span>
            </>
          )}
          {status === 'scheduled' && (
            <>
              <Clock size={16} className="text-yellow-600" />
              <span className="text-[10px] font-bold text-yellow-600 mt-1">予定</span>
            </>
          )}
          {status === 'ended' && (
            <>
              <div className="h-10 w-1 rounded-full bg-gray-300" />
              <span className="text-[10px] font-bold text-gray-600 mt-1">終了</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function FilterButton({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-md px-3 py-2 text-xs font-bold text-left transition ${
        selected ? 'bg-primary text-white shadow-sm' : 'border border-border bg-background hover:bg-secondary'
      }`}
      data-testid={`filter-event-${value}`}
    >
      {label}
    </button>
  );
}
