import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

type MedalTag = {
  id: string;
  name: string;
  twoSetEffect: string;
  threeSetEffect: string;
};

type Medal = {
  id: string;
  name: string;
  uniqueTrait: string;
};

export default function MedalTagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<MedalTag | null>(null);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/medal-tags/${encodeURIComponent(id ?? "")}/detail`);
        if (!response.ok) throw new Error("タグ詳細の取得に失敗しました");
        const data = (await response.json()) as { tag: MedalTag; medals: Medal[] };
        setTag(data.tag);
        setMedals(data.medals ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return <GuideShell><div className="rounded-md border border-card-border bg-card py-16 text-center text-xs text-muted-foreground">読み込み中…</div></GuideShell>;
  }

  if (!tag || error) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="メダルタグが見つかりません"
          description={error || "指定されたタグが存在しません。"}
          action={<Link href="/medals" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white">メダル一覧へ</Link>}
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

        <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
          <h1 className="text-2xl font-black">{tag.name}</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-background p-4">
              <div className="text-xs font-black text-muted-foreground">2セット効果</div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{tag.twoSetEffect || "未登録"}</p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <div className="text-xs font-black text-muted-foreground">3セット効果</div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{tag.threeSetEffect || "未登録"}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">同じタグを持つメダル</h2>
          {medals.length > 0 ? (
            <div className="space-y-2">
              {medals.map((medal) => (
                <Link key={medal.id} href={`/medals/${medal.id}`} className="block rounded-md border border-border bg-background p-3 hover:bg-secondary">
                  <div className="font-bold">{medal.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{medal.uniqueTrait || "固有特性未登録"}</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">このタグを持つメダルはまだありません。</p>
          )}
        </section>
      </div>
    </GuideShell>
  );
}
