import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import type { Medal, MedalTag } from "@/data/medal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

export default function MedalTagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<MedalTag | null>(null);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch(`${API_BASE_URL}/medal-tags`), fetch(`${API_BASE_URL}/medals`)])
      .then(async ([tagsResponse, medalsResponse]) => {
        if (!tagsResponse.ok || !medalsResponse.ok) {
          throw new Error("タグ詳細の取得に失敗しました");
        }
        const tags = (await tagsResponse.json()) as MedalTag[];
        const fetchedMedals = (await medalsResponse.json()) as Medal[];
        setTag(tags.find((item) => item.id === id) ?? null);
        setMedals(fetchedMedals);
      })
      .catch(() => {
        setTag(null);
        setMedals([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const relatedMedals = useMemo(
    () => medals.filter((medal) => medal.medalTags.includes(id ?? "")),
    [medals, id],
  );

  if (loading) {
    return (
      <GuideShell>
        <PageIntro eyebrow="MEDAL TAG / LOADING" title="読み込み中…" />
      </GuideShell>
    );
  }

  if (!tag) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="MEDAL TAG / 404"
          title="タグが見つかりません"
          action={
            <Link
              href="/medals"
              className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              メダル一覧に戻る
            </Link>
          }
        />
      </GuideShell>
    );
  }

  return (
    <GuideShell>
      <Link
        href="/medals"
        className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} /> メダル一覧に戻る
      </Link>

      <PageIntro
        eyebrow="MEDAL TAG DETAIL"
        title={tag.name}
        description="同じメダルタグのセット効果と対象メダルを確認できます。"
      />

      <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">
          2セット効果
        </h2>
        <p className="whitespace-pre-wrap rounded-md bg-primary/5 p-4 text-sm leading-7">
          {tag.twoSetEffect || tag.effect || "未登録"}
        </p>

        <h2 className="mb-3 mt-6 text-sm font-black uppercase tracking-wider text-muted-foreground">
          3セット効果
        </h2>
        <p className="whitespace-pre-wrap rounded-md bg-primary/5 p-4 text-sm leading-7">
          {tag.threeSetEffect || "未登録"}
        </p>
      </section>

      <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
          同じタグを持つメダル
        </h2>

        {relatedMedals.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {relatedMedals.map((medal) => (
              <Link
                key={medal.id}
                href={`/medals/${medal.id}`}
                className="flex items-center gap-3 rounded-md border border-card-border bg-background p-3 hover:border-primary"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded bg-secondary">
                  {medal.imageUrl ? (
                    <img
                      src={medal.imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">印</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">{medal.name}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    {medal.uniqueTrait || "固有特性未登録"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">該当メダルがありません。</p>
        )}
      </section>
    </GuideShell>
  );
}
