import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro, SidebarCard } from "@/components/guide-shell";

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
};

export default function MedalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [medal, setMedal] = useState<Medal | null>(null);
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [medalResponse, tagsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/medals/${encodeURIComponent(id ?? "")}`),
          fetch(`${API_BASE_URL}/medal-tags`),
        ]);

        if (!medalResponse.ok) throw new Error("メダル情報の取得に失敗しました");
        if (!tagsResponse.ok) throw new Error("メダルタグの取得に失敗しました");

        setMedal((await medalResponse.json()) as Medal);
        setTags((await tagsResponse.json()) as MedalTag[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  const tagNameMap = useMemo(
    () =>
      Object.fromEntries(
        tags.map((tag) => [tag.id, tag.name]),
      ) as Record<string, string>,
    [tags],
  );

  if (loading) {
    return <GuideShell><div className="rounded-md border border-card-border bg-card py-16 text-center text-xs text-muted-foreground">読み込み中…</div></GuideShell>;
  }

  if (!medal || error) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="メダルが見つかりません"
          description={error || "指定されたメダルが存在しません。"}
          action={<Link href="/medals" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white">一覧に戻る</Link>}
        />
      </GuideShell>
    );
  }

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/medals" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft size={14} /> メダル一覧に戻る
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
              <h1 className="text-3xl font-black leading-tight">{medal.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {(medal.medalTagIds ?? []).map((tagId) => (
                  <Link
                    key={tagId}
                    href={`/medal-tags/${tagId}`}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                  >
                    {tagNameMap[tagId] ?? tagId}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">固有特性</h2>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{medal.uniqueTrait || "未登録"}</p>
            </section>

            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">追加特性</h2>
              <ul className="space-y-2 text-sm">
                {[medal.additionalTrait1, medal.additionalTrait2, medal.additionalTrait3].map((trait, index) => (
                  <li key={index} className="rounded-md border border-border bg-background p-3">
                    {trait || `追加特性${index + 1}未登録`}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">タグ効果</h2>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{medal.tagEffect || "未登録"}</p>
            </section>

            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">抽選割合</h2>
              {(medal.additionalLotteries ?? []).length > 0 ? (
                <div className="space-y-2">
                  {medal.additionalLotteries.map((lottery, index) => (
                    <div key={index} className="grid gap-2 rounded-md border border-border bg-background p-3 text-xs sm:grid-cols-[72px_minmax(0,1fr)_88px]">
                      <span className="font-black">★{lottery.star}</span>
                      <span className="break-words">{lottery.effect}</span>
                      <span className="font-data sm:text-right">{lottery.probability}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">抽選割合は未登録です。</p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <SidebarCard title="メダル情報">
              <div className="space-y-3 text-sm">
                <div><span className="text-xs font-bold text-muted-foreground">ID</span><div className="font-data">{medal.id}</div></div>
                <div className="border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">タグ数</span><div className="font-bold">{medal.medalTagIds.length}</div></div>
                <div className="border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">抽選数</span><div className="font-bold">{medal.additionalLotteries.length}</div></div>
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </GuideShell>
  );
}
