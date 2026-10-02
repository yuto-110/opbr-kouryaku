import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import type { Medal, MedalTag } from "@/data/medal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

export default function MedalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [medal, setMedal] = useState<Medal | null>(null);
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/medals/${encodeURIComponent(id ?? "")}`),
      fetch(`${API_BASE_URL}/medal-tags`),
    ])
      .then(async ([response, tagsResponse]) => {
        if (!response.ok) throw new Error("メダルが見つかりません");
        setMedal((await response.json()) as Medal);
        if (tagsResponse.ok) setTags((await tagsResponse.json()) as MedalTag[]);
      })
      .catch(() => setMedal(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <GuideShell>
        <PageIntro eyebrow="MEDAL / LOADING" title="読み込み中…" />
      </GuideShell>
    );

  if (!medal)
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="メダルが見つかりません"
          action={
            <Link
              href="/medals"
              className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              一覧に戻る
            </Link>
          }
        />
      </GuideShell>
    );

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link
          href="/medals"
          className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={14} /> メダル一覧に戻る
        </Link>

        <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="h-44 w-44 overflow-hidden rounded-md bg-secondary">
              {medal.imageUrl ? (
                <img
                  src={medal.imageUrl}
                  alt={medal.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full place-items-center text-4xl font-black text-muted-foreground">
                  印
                </div>
              )}
            </div>
            <div className="flex w-full max-w-2xl items-center justify-between gap-4 text-left">
              <h1 className="text-3xl font-black">{medal.name}</h1>
              <button
                onClick={() => setSaved((value) => !value)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${saved ? "bg-primary text-white" : "border border-border bg-background"}`}
              >
                <Bookmark size={16} />
                {saved ? "保存済み" : "保存"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">
            固有特性
          </h2>
          <p className="rounded-md bg-primary/5 p-4 text-sm font-bold leading-7">
            {medal.uniqueTrait || "未登録"}
          </p>
        </section>

        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
            追加特性1〜3
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {medal.additionalTraits.map((trait, index) => (
              <div key={index} className="rounded border border-border bg-background p-3">
                <div className="text-xs font-black text-muted-foreground">
                  追加特性{index + 1}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm font-bold">
                  {trait || "未登録"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
            メダルタグ
          </h2>
          <div className="flex flex-wrap gap-2">
            {medal.medalTags.length ? (
              medal.medalTags.map((tagId) => (
                <Link
                  key={tagId}
                  href={`/medal-tags/${tagId}`}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                >
                  {tags.find((tag) => tag.id === tagId)?.name ?? tagId}
                </Link>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">未登録</span>
            )}
          </div>
          <div className="mt-3 rounded-md bg-primary/5 p-3 text-sm whitespace-pre-wrap">
            {medal.tagEffect || "タグ効果未登録"}
          </div>
        </section>

        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
            抽選割合
          </h2>
          <div className="space-y-2">
            {medal.drawRates.length ? (
              medal.drawRates.map((rate, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded bg-background p-3 text-sm md:grid-cols-[80px_minmax(0,1fr)_120px]"
                >
                  <span className="font-black text-amber-600">★{rate.stars}</span>
                  <span className="min-w-0 break-words">{rate.content}</span>
                  <span className="font-data text-muted-foreground">
                    {rate.probability.toFixed(2)}%
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">未登録</span>
            )}
          </div>
        </section>
      </div>
    </GuideShell>
  );
}
