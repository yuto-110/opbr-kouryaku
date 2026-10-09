import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import type { Medal, MedalTag } from "@/data/medal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";

export default function MedalTagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<MedalTag | null>(null);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/medal-tags/${encodeURIComponent(id ?? "")}`),
      fetch(`${API_BASE_URL}/medals`),
    ])
      .then(async ([tagResponse, medalsResponse]) => {
        if (!tagResponse.ok) throw new Error("メダルタグが見つかりません");
        setTag((await tagResponse.json()) as MedalTag);
        if (medalsResponse.ok) setMedals((await medalsResponse.json()) as Medal[]);
      })
      .catch(() => setTag(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GuideShell><PageIntro eyebrow="MEDAL TAG / LOADING" title="読み込み中…" /></GuideShell>;
  if (!tag) return <GuideShell><PageIntro eyebrow="ERROR / 404" title="メダルタグが見つかりません" action={<Link href="/medals" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white">メダル一覧へ</Link>} /></GuideShell>;

  const taggedMedals = medals.filter((medal) => medal.medalTags.includes(tag.id));

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/medals" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> メダル一覧に戻る</Link>
        <PageIntro eyebrow="MEDAL TAG DETAIL" title={tag.name} description="このタグを持つメダルを確認できます。" />
        <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">タグ効果</h2>
          <div className="space-y-4">
            <div><h3 className="text-xs font-black text-primary">2セット効果</h3><p className="mt-1 text-sm leading-7">{tag.twoSetEffect || "未登録"}</p></div>
            <div className="border-t border-border pt-4"><h3 className="text-xs font-black text-primary">3セット効果</h3><p className="mt-1 text-sm leading-7">{tag.threeSetEffect || "未登録"}</p></div>
          </div>
        </section>
        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">同じタグを持つメダル</h2>
          <div className="grid gap-3 md:grid-cols-2">{taggedMedals.map((medal) => <Link key={medal.id} href={`/medals/${medal.id}`} className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-secondary"><div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-secondary">{medal.imageUrl ? <img src={medal.imageUrl} alt="" className="h-full w-full object-contain" /> : null}</div><span className="text-sm font-black">{medal.name}</span></Link>)}</div>
          {!taggedMedals.length ? <p className="text-sm text-muted-foreground">このタグを持つメダルはありません。</p> : null}
        </section>
      </div>
    </GuideShell>
  );
}
