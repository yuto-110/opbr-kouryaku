import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import type { Medal } from "@/data/medal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";

export default function MedalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [medal, setMedal] = useState<Medal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/medals/${encodeURIComponent(id ?? "")}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("メダルが見つかりません");
        setMedal((await response.json()) as Medal);
      })
      .catch(() => setMedal(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GuideShell><PageIntro eyebrow="MEDAL / LOADING" title="読み込み中…" /></GuideShell>;
  if (!medal) return <GuideShell><PageIntro eyebrow="ERROR / 404" title="メダルが見つかりません" action={<Link href="/medals" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white">一覧に戻る</Link>} /></GuideShell>;

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/medals" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> メダル一覧に戻る</Link>
        <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="h-44 w-44 overflow-hidden rounded-md bg-secondary">{medal.imageUrl ? <img src={medal.imageUrl} alt={medal.name} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-4xl font-black text-muted-foreground">印</div>}</div>
            <div className="flex w-full max-w-2xl items-center justify-between gap-4 text-left">
              <h1 className="text-3xl font-black">{medal.name}</h1>
              <button onClick={() => setSaved((value) => !value)} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${saved ? "bg-primary text-white" : "border border-border bg-background"}`}><Bookmark size={16} />{saved ? "保存済み" : "保存"}</button>
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">固有特性</h2>
          <p className="rounded-md bg-primary/5 p-4 text-sm font-bold leading-7">{medal.uniqueTrait || "未登録"}</p>
        </section>
        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">メダルタグ</h2>
          <div className="flex flex-wrap gap-2">{medal.medalTags.length ? medal.medalTags.map((tag) => <span key={tag} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{tag}</span>) : <span className="text-sm text-muted-foreground">未登録</span>}</div>
        </section>
        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">追加特性</h2>
          <div className="space-y-3">{medal.additionalTraits.map((trait, index) => <div key={index} className="rounded-md border border-border p-4"><h3 className="font-black">追加特性{index + 1}</h3><p className="mt-2 text-sm leading-6">{trait.content || "未登録"}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span>抽選割合：{trait.drawRate || "未登録"}</span><span>{trait.unlockCondition || "解放条件未登録"}</span></div></div>)}</div>
        </section>
      </div>
    </GuideShell>
  );
}
