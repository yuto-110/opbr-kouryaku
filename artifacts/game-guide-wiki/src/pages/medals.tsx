import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { EmptyState, GuideShell, PageIntro, SidebarCard } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

type Medal = {
  id: string;
  name: string;
  imageUrl?: string;
  uniqueTrait: string;
  additionalTrait1: string;
  additionalTrait2: string;
  additionalTrait3: string;
  medalTagIds: string[];
  tagEffect: string;
  additionalLotteries: Array<{
    star: 1 | 2 | 3;
    effect: string;
    probability: string;
  }>;
};

type MedalTag = {
  id: string;
  name: string;
  twoSetEffect: string;
  threeSetEffect: string;
};

export default function MedalsPage() {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [medals, setMedals] = useState<Medal[]>([]);
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [medalsResponse, tagsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/medals`),
          fetch(`${API_BASE_URL}/medal-tags`),
        ]);

        if (!medalsResponse.ok) throw new Error("メダル一覧の取得に失敗しました");
        if (!tagsResponse.ok) throw new Error("メダルタグの取得に失敗しました");

        setMedals((await medalsResponse.json()) as Medal[]);
        setTags((await tagsResponse.json()) as MedalTag[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const tagNameMap = useMemo(
    () =>
      Object.fromEntries(
        tags.map((tag) => [tag.id, tag.name]),
      ) as Record<string, string>,
    [tags],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return medals.filter((item) => {
      const haystack = [
        item.name,
        item.uniqueTrait,
        item.additionalTrait1,
        item.additionalTrait2,
        item.additionalTrait3,
        item.tagEffect,
        ...(item.medalTagIds ?? []).map((tagId) => tagNameMap[tagId] ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (tagFilter === "all" || (item.medalTagIds ?? []).includes(tagFilter))
      );
    });
  }, [medals, query, tagFilter, tagNameMap]);

  return (
    <GuideShell>
      <PageIntro
        eyebrow="MEDAL DATABASE"
        title="メダル"
        description="メダルタグと特性を確認しながら比較できます。"
        action={
          <div className="hidden items-center gap-2 text-right sm:flex">
            <span className="font-data text-2xl font-semibold text-primary">{filtered.length}</span>
            <span className="text-[10px] text-muted-foreground">MEDALS</span>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <div className="rounded-md border border-card-border bg-card p-3 shadow-card">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="メダル名、特性、タグ効果で検索"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                data-testid="input-medal-search"
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-md border border-card-border bg-card py-16 text-center text-xs text-muted-foreground">読み込み中…</div>
          ) : error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</div>
          ) : filtered.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {filtered.map((medal) => (
                <Link
                  key={medal.id}
                  href={`/medals/${medal.id}`}
                  className="group rounded-md border border-card-border bg-card p-4 shadow-card transition hover:border-primary/40"
                >
                  <h3 className="truncate text-sm font-black group-hover:text-primary">{medal.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{medal.uniqueTrait || "固有特性未登録"}</p>
                  <p className="mt-2 text-xs font-bold text-primary">{medal.tagEffect || "タグ効果未登録"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(medal.medalTagIds ?? []).map((tagId) => (
                      <span
                        key={`${medal.id}-${tagId}`}
                        className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground"
                      >
                        {tagNameMap[tagId] ?? tagId}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4"><EmptyState label="条件に一致するメダルが見つかりません" /></div>
          )}
        </div>

        <aside>
          <SidebarCard title="メダルタグ検索">
            <label className="block text-[10px] font-bold text-muted-foreground">
              タグ
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className="mt-1 w-full rounded-sm border border-border bg-background p-2 text-xs font-bold outline-none"
              >
                <option value="all">すべて</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </label>

            <button
              onClick={() => {
                setQuery("");
                setTagFilter("all");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 border-t border-border pt-3 text-[10px] font-bold text-muted-foreground hover:text-primary"
              data-testid="button-reset-medal-filter"
            >
              <SlidersHorizontal size={13} />条件をリセット
            </button>
          </SidebarCard>
        </aside>
      </div>
    </GuideShell>
  );
}
