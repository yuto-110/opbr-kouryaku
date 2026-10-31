import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CalendarDays, LoaderCircle, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell } from "@/components/guide-shell";
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE, formatJst, getEventStatus } from "@/lib/admin-api";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { useApiData, type ApiState } from "@/lib/use-api";

// ホーム画面：すべて公開APIの実データ。取得できない場合は空状態・エラー表示にし、架空のデータは出さない。
type HomeCharacter = { id: string; name: string; tier: string; rarity: string; role: { base: string }; imageUrl?: string };
type HomeMedal = { id: string; name: string; uniqueTrait?: string; imageUrl?: string };
type HomeBattle = { id: string; name: string; startDate: string; endDate: string };
type HomeEvent = { id: string; name: string; eventCategory: string; startDate: string; endDate: string; missionCount: number };

const PREVIEW_COUNT = 6;
const INFO_COUNT = 3;

function Thumb({ url, className }: { url?: string; className: string }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-sm bg-secondary`}>
      {url ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function Section({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-xl font-black">{title}</h2>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
          {linkLabel}
          <ArrowRight size={13} />
        </Link>
      </div>
      {children}
    </section>
  );
}

/** 読み込み中・失敗・0件の表示を共通化（成功して1件以上ある場合だけ children を表示） */
function DataState<T extends unknown[]>({
  state,
  emptyText,
  errorText,
  children,
}: {
  state: ApiState<T>;
  emptyText: string;
  errorText: string;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-card-border bg-card p-4 text-xs text-muted-foreground">
        <LoaderCircle size={14} className="animate-spin" />
        読み込み中…
      </p>
    );
  }
  if (state.error || !state.data) {
    return <p className="rounded-md border border-card-border bg-card p-4 text-xs text-muted-foreground">{errorText}</p>;
  }
  if (state.data.length === 0) {
    return <p className="rounded-md border border-card-border bg-card p-4 text-xs text-muted-foreground">{emptyText}</p>;
  }
  return <>{children(state.data)}</>;
}

function StatusBadge({ startDate, endDate }: { startDate: string; endDate: string }) {
  const status = getEventStatus(startDate, endDate);
  return <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${EVENT_STATUS_STYLE[status]}`}>{EVENT_STATUS_LABEL[status]}</span>;
}

function InfoCard({ href, name, startDate, endDate, note }: { href: string; name: string; startDate: string; endDate: string; note?: string }) {
  return (
    <Link href={href} className="block rounded-md border border-card-border bg-card p-4 shadow-card transition hover:border-primary/40">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <StatusBadge startDate={startDate} endDate={endDate} />
        {note ? <span className="text-[10px] text-muted-foreground">{note}</span> : null}
      </div>
      <h3 className="break-words text-sm font-black leading-snug">{name}</h3>
      <p className="mt-1.5 flex items-start gap-1 text-[11px] text-muted-foreground">
        <CalendarDays size={12} className="mt-0.5 shrink-0" />
        <span>{formatJst(startDate)} 〜 {formatJst(endDate)}</span>
      </p>
    </Link>
  );
}

/** 開催中 → 開催予定 の順に最大 INFO_COUNT 件（終了済みはホームには出さない） */
function pickActive<T extends { startDate: string; endDate: string }>(list: T[]): T[] {
  const now = Date.now();
  const rank = (item: T) => {
    const status = getEventStatus(item.startDate, item.endDate, now);
    return status === "ongoing" ? 0 : status === "upcoming" ? 1 : 2;
  };
  return list
    .filter((item) => rank(item) < 2)
    .sort((a, b) => rank(a) - rank(b) || new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, INFO_COUNT);
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"characters" | "medals">("characters");

  const characters = useApiData<HomeCharacter[]>("/characters");
  const medals = useApiData<HomeMedal[]>("/medals");
  const battles = useApiData<HomeBattle[]>("/challenge-battles");
  const events = useApiData<HomeEvent[]>("/event-missions");

  const activeBattles = useMemo(() => (battles.data ? pickActive(battles.data) : []), [battles.data]);
  const activeEvents = useMemo(() => (events.data ? pickActive(events.data) : []), [events.data]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const keyword = query.trim();
    navigate(`/${scope}${keyword ? `?search=${encodeURIComponent(keyword)}` : ""}`);
  }

  return (
    <GuideShell>
      {/* 1-2. サイト名・説明・検索 */}
      <section className="rounded-lg border border-card-border bg-card p-5 shadow-card sm:p-8">
        <p className="text-[11px] font-bold tracking-widest text-primary">ONE PIECE BOUNTY RUSH</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">{SITE_NAME}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {SITE_TAGLINE}。キャラクター・メダル・チャレンジバトル・イベントミッションの情報を、検索して確認できます。
        </p>

        <form onSubmit={submit} className="mt-5" role="search">
          <div className="flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={scope === "characters" ? "キャラクター名・タグで検索" : "メダル名・特性で検索"}
                className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
                aria-label="検索キーワード"
                data-testid="input-home-search"
              />
            </label>
            <button type="submit" className="shrink-0 rounded-md bg-primary px-4 text-sm font-bold text-white" data-testid="button-home-search">検索</button>
          </div>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label="検索対象">
            {(
              [
                ["characters", "キャラクター"],
                ["medals", "メダル"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scope === value}
                onClick={() => setScope(value)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold ${scope === value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </form>

        {/* 登録数（取得できた場合のみ） */}
        {characters.data || medals.data ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {characters.data ? `登録キャラクター ${characters.data.length}体` : ""}
            {characters.data && medals.data ? "　/　" : ""}
            {medals.data ? `登録メダル ${medals.data.length}種` : ""}
          </p>
        ) : null}
      </section>

      {/* 3. キャラクター */}
      <Section title="キャラクター" href="/characters" linkLabel="キャラクター一覧へ">
        <DataState state={characters} emptyText="登録されているキャラクターはまだありません。" errorText="キャラクターを読み込めませんでした。時間をおいて、もう一度お試しください。">
          {(list) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, PREVIEW_COUNT).map((character) => (
                <Link key={character.id} href={`/characters/${character.id}`} className="flex min-w-0 items-center gap-3 rounded-md border border-card-border bg-card p-3 shadow-card transition hover:border-primary/40">
                  <Thumb url={character.imageUrl} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{character.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{character.rarity}／{character.role?.base}</p>
                  </div>
                  <span className="font-data shrink-0 whitespace-nowrap rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">{character.tier}</span>
                </Link>
              ))}
            </div>
          )}
        </DataState>
      </Section>

      {/* 4. メダル */}
      <Section title="メダル" href="/medals" linkLabel="メダル一覧へ">
        <DataState state={medals} emptyText="登録されているメダルはまだありません。" errorText="メダルを読み込めませんでした。時間をおいて、もう一度お試しください。">
          {(list) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, PREVIEW_COUNT).map((medal) => (
                <Link key={medal.id} href={`/medals/${medal.id}`} className="flex min-w-0 items-center gap-3 rounded-md border border-card-border bg-card p-3 shadow-card transition hover:border-primary/40">
                  <Thumb url={medal.imageUrl} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{medal.name}</p>
                    {medal.uniqueTrait ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{medal.uniqueTrait}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DataState>
      </Section>

      {/* 5. チャレンジバトル */}
      <Section title="チャレンジバトル" href="/challenge-battles" linkLabel="チャレンジバトル一覧へ">
        <DataState state={battles} emptyText="登録されているチャレンジバトルはまだありません。" errorText="チャレンジバトルを読み込めませんでした。時間をおいて、もう一度お試しください。">
          {() =>
            activeBattles.length === 0 ? (
              <p className="rounded-md border border-card-border bg-card p-4 text-xs text-muted-foreground">現在、開催中・開催予定のチャレンジバトルはありません。過去の情報は一覧から確認できます。</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activeBattles.map((battle) => (
                  <InfoCard key={battle.id} href={`/challenge-battles/${battle.id}`} name={battle.name} startDate={battle.startDate} endDate={battle.endDate} />
                ))}
              </div>
            )
          }
        </DataState>
      </Section>

      {/* 6. イベントミッション（/events とは別機能） */}
      <Section title="イベントミッション" href="/event-missions" linkLabel="イベントミッション一覧へ">
        <DataState state={events} emptyText="公開中のイベントミッションはまだありません。" errorText="イベントミッションを読み込めませんでした。時間をおいて、もう一度お試しください。">
          {() =>
            activeEvents.length === 0 ? (
              <p className="rounded-md border border-card-border bg-card p-4 text-xs text-muted-foreground">現在、開催中・開催予定のイベントミッションはありません。過去の情報は一覧から確認できます。</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activeEvents.map((event) => (
                  <InfoCard key={event.id} href={`/event-missions/${event.id}`} name={event.name} startDate={event.startDate} endDate={event.endDate} note={`ミッション${event.missionCount}件`} />
                ))}
              </div>
            )
          }
        </DataState>
      </Section>

      {/* 使い方：既存ページへの導線 */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-black">このサイトでできること</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/characters", title: "キャラクターを調べる", text: "評価・スキル・ステータス・タグを確認できます。" },
            { href: "/medals", title: "メダルを調べる", text: "固有特性・追加特性・メダルタグを確認できます。" },
            { href: "/support", title: "サポート編成", text: "キャラクターを選んで、編成候補を確認できます。" },
            { href: "/about", title: "サイトについて", text: "このサイトの目的と、非公式サイトである旨をご案内します。" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md border border-card-border bg-card p-4 shadow-card transition hover:border-primary/40">
              <h3 className="text-sm font-black">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </GuideShell>
  );
}
