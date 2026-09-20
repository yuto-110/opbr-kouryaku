import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { EmptyState, GuideShell, PageIntro, SidebarCard } from "@/components/guide-shell";
import type { Medal, MedalTag } from "@/data/medal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";

function MedalCard({ medal, tags }: { medal: Medal; tags: MedalTag[] }) {
  return (
    <Link href={`/medals/${medal.id}`} className="interactive-card group rounded-md border border-card-border bg-card p-4 shadow-card">
      <div className="flex gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-secondary">
          {medal.imageUrl ? <img src={medal.imageUrl} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="font-black text-muted-foreground">印</span>}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black group-hover:text-primary">{medal.name}</h2>
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-foreground/80">{medal.uniqueTrait || "固有特性未登録"}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {medal.medalTags.slice(0, 3).map((tagId) => <span key={tagId} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground">{tags.find((tag) => tag.id === tagId)?.name ?? tagId}</span>)}
      </div>
    </Link>
  );
}

export default function MedalsPage() {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch(`${API_BASE_URL}/medals`), fetch(`${API_BASE_URL}/medal-tags`)])
      .then(async ([response, tagsResponse]) => {
        if (!response.ok) throw new Error("メダル一覧の取得に失敗しました");
        setMedals((await response.json()) as Medal[]);
        if (tagsResponse.ok) setTags((await tagsResponse.json()) as MedalTag[]);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "メダル一覧の取得に失敗しました"));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return medals.filter((medal) => (!normalized || `${medal.name}${medal.uniqueTrait}${medal.medalTags.map((tagId) => tags.find((tag) => tag.id === tagId)?.name ?? tagId).join("")}`.toLowerCase().includes(normalized)) && selectedTags.every((tag) => medal.medalTags.includes(tag)));
  }, [medals, query, selectedTags, tags]);

  return (
    <GuideShell>
      <PageIntro eyebrow="MEDAL DATABASE" title="メダル" description="固有特性・タグ・追加特性を比較して、編成に合うメダルを選ぶ。" action={<span className="font-data text-2xl font-semibold text-primary">{filtered.length}</span>} />
      {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <label className="flex items-center gap-2 rounded-md border border-card-border bg-card p-3 shadow-card">
            <Search size={16} className="text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="メダル名、固有特性、タグで検索" className="w-full bg-transparent text-sm outline-none" data-testid="input-medal-search" />
          </label>
          <div className="mt-3 rounded-md border border-card-border bg-card p-3"><div className="mb-2 text-xs font-bold">メダルタグで絞り込み</div><div className="flex flex-wrap gap-2">{tags.map((tag) => <label key={tag.id} className="rounded border border-border px-2 py-1 text-xs"><input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={(event) => setSelectedTags((current) => event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))} /> {tag.name}</label>)}</div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{filtered.map((medal) => <MedalCard key={medal.id} medal={medal} tags={tags} />)}</div>
          {!filtered.length ? <div className="mt-4"><EmptyState label="登録されたメダルがありません" /></div> : null}
        </div>
        <aside><SidebarCard title="メダル情報"><p className="text-xs leading-5 text-muted-foreground">メダルタグはキャラクタータグとは別のマスターデータです。</p></SidebarCard></aside>
      </div>
    </GuideShell>
  );
}
