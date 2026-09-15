import { ArrowLeft, Calendar, Gift, MapPin, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getEvent, getEventStatus } from '@/data/mockData';
import { GuideShell, PageIntro, SidebarCard } from '@/components/guide-shell';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const event = getEvent(id);
  const status = event ? getEventStatus(event) : undefined;

  if (!event) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="イベントが見つかりません"
          description="指定されたイベントはまだ登録されていないか、削除されました。"
          action={<Link href="/events" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90">イベント一覧に戻る</Link>}
        />
      </GuideShell>
    );
  }

  const startDate = event.startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  const endDate = event.endDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  
  const now = new Date();
  const timeUntilStart = Math.ceil((event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const timeUntilEnd = Math.ceil((event.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const statusLabel = status === 'ongoing' ? '開催中' : status === 'scheduled' ? '開催予定' : '終了';
  const statusColor = status === 'ongoing' ? 'bg-red-50 border-red-200 text-red-700' : status === 'scheduled' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-700';
  const statusIcon = status === 'ongoing' ? '🔴' : status === 'scheduled' ? '🟡' : '⚫';

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/events" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary" data-testid="link-back-events">
          <ArrowLeft size={14} /> イベント一覧に戻る
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* メインコンテンツ */}
          <div>
            {/* ヘッダーセクション */}
            <section className="rounded-md border border-card-border bg-card shadow-card overflow-hidden">
              <div className="h-[200px] w-full" style={{ backgroundColor: event.color, opacity: 0.2 }}>
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl">
                    {event.type === 'gacha' && '🎰'}
                    {event.type === 'challenge-battle' && '⚔️'}
                    {event.type === 'mission' && '📋'}
                    {event.type === 'campaign' && '🎉'}
                    {event.type === 'other' && '📅'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-bold ${statusColor}`}>
                    {statusIcon} {statusLabel}
                  </span>
                  <span className="inline-flex items-center rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">
                    {event.type === 'gacha' && 'ガチャ'}
                    {event.type === 'challenge-battle' && 'チャレンジバトル'}
                    {event.type === 'mission' && 'ミッション'}
                    {event.type === 'campaign' && 'キャンペーン'}
                    {event.type === 'other' && 'その他'}
                  </span>
                </div>
                <h1 className="mb-2 text-3xl font-black leading-tight">{event.name}</h1>
                <p className="text-sm text-muted-foreground">{event.overview}</p>
              </div>
            </section>

            {/* 開催期間 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                <Calendar size={16} /> 開催期間
              </h2>
              <div className="space-y-3">
                <div className="rounded-md bg-secondary p-4">
                  <div className="mb-1 text-xs font-bold text-muted-foreground">開始日時</div>
                  <div className="font-bold text-foreground">{startDate}</div>
                  {status === 'scheduled' && <div className="mt-2 text-xs text-muted-foreground">残り {timeUntilStart} 日で開始</div>}
                </div>
                <div className="rounded-md bg-secondary p-4">
                  <div className="mb-1 text-xs font-bold text-muted-foreground">終了日時</div>
                  <div className="font-bold text-foreground">{endDate}</div>
                  {status === 'ongoing' && <div className="mt-2 text-xs text-muted-foreground">残り {timeUntilEnd} 日で終了</div>}
                  {status === 'ended' && <div className="mt-2 text-xs text-red-600">イベントは終了しました</div>}
                </div>
              </div>
            </section>

            {/* イベント説明 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">イベント説明</h2>
              <p className="leading-relaxed text-foreground">{event.overview}</p>
              <div className="mt-4 rounded-md bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 ヒント:</strong> このイベントの詳細情報や、攻略方法については攻略記事をご覧ください。
                </p>
              </div>
            </section>

            {/* ルール */}
            {event.rules && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">ルール</h2>
                <p className="leading-relaxed text-foreground">{event.rules}</p>
              </section>
            )}

            {/* 報酬 */}
            {event.rewards.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                  <Gift size={16} /> 報酬
                </h2>
                <div className="grid gap-2">
                  {event.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                      <span className="text-lg">🎁</span>
                      <span className="font-bold text-foreground">{reward}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ミッション */}
            {event.missions && event.missions.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 size={16} /> ミッション
                </h2>
                <div className="space-y-3">
                  {event.missions.map((mission, index) => (
                    <div key={index} className="rounded-md border border-border bg-background p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{mission.title}</h3>
                          <p className="text-xs text-muted-foreground">{mission.description}</p>
                        </div>
                        <input type="checkbox" className="mt-1" disabled data-testid={`mission-${index}`} />
                      </div>
                      <div className="border-t border-border pt-2">
                        <div className="mb-1 text-xs font-bold text-muted-foreground">条件</div>
                        <p className="text-sm text-foreground">{mission.condition}</p>
                      </div>
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="mb-1 text-xs font-bold text-muted-foreground">報酬</div>
                        <p className="text-sm font-bold text-primary">{mission.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 攻略ガイド */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">攻略ガイド</h2>
              <div className="space-y-2">
                <Link href="/strategy" className="flex items-center justify-between rounded-md border border-border bg-background p-3 hover:bg-secondary">
                  <span className="text-sm font-bold">関連攻略記事を見る</span>
                  <span>→</span>
                </Link>
                <Link href="/support" className="flex items-center justify-between rounded-md border border-border bg-background p-3 hover:bg-secondary">
                  <span className="text-sm font-bold">編成シミュレーターで対策を考える</span>
                  <span>→</span>
                </Link>
              </div>
            </section>
          </div>

          {/* サイドバー */}
          <aside className="space-y-5">
            {/* ステータス */}
            <SidebarCard title="イベント状態">
              <div className={`rounded-md border p-4 ${statusColor}`}>
                <div className="mb-2 text-2xl">{statusIcon}</div>
                <div className="font-bold text-lg">{statusLabel}</div>
                {status === 'scheduled' && (
                  <p className="mt-2 text-xs">開始まで {timeUntilStart} 日</p>
                )}
                {status === 'ongoing' && (
                  <p className="mt-2 text-xs">終了まで {timeUntilEnd} 日</p>
                )}
              </div>
            </SidebarCard>

            {/* イベント情報 */}
            <SidebarCard title="イベント情報">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-muted-foreground">TYPE</span>
                  <div className="font-bold">
                    {event.type === 'gacha' && 'ガチャ'}
                    {event.type === 'challenge-battle' && 'チャレンジバトル'}
                    {event.type === 'mission' && 'ミッション'}
                    {event.type === 'campaign' && 'キャンペーン'}
                    {event.type === 'other' && 'その他'}
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">REWARD COUNT</span>
                  <div className="font-bold">{event.rewards.length} 種類</div>
                </div>
                {event.missions && (
                  <div className="border-t border-border pt-3">
                    <span className="text-xs font-bold text-muted-foreground">MISSION COUNT</span>
                    <div className="font-bold">{event.missions.length} 個</div>
                  </div>
                )}
              </div>
            </SidebarCard>

            {/* 注意事項 */}
            <SidebarCard title="注意事項">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <AlertCircle size={14} className="shrink-0 text-yellow-600" />
                  <p>イベント終了後、報酬は受け取れなくなります</p>
                </div>
                <div className="flex gap-2">
                  <AlertCircle size={14} className="shrink-0 text-yellow-600" />
                  <p>ミッションの進捗はイベント中に完了する必要があります</p>
                </div>
              </div>
            </SidebarCard>

            {/* クイックリンク */}
            <SidebarCard title="その他">
              <div className="space-y-2 text-xs">
                <Link href="/events" className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-secondary">
                  <span>📅</span>
                  <span>イベント一覧</span>
                </Link>
                <Link href="/characters" className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-secondary">
                  <span>🗡️</span>
                  <span>キャラクター</span>
                </Link>
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </GuideShell>
  );
}
