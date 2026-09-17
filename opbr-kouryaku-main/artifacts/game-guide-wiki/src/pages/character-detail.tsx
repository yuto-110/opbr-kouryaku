import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Share2,
  Shield,
  Sword,
  Users,
  Zap,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { GuideShell, PageIntro, SidebarCard } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

type Character = {
  id: string;
  name: string;
  reading?: string;
  faction?: string;
  description?: string;
  tags?: string[];
  attribute: { base: string; changesTo?: string[] };
  role: { base: string; changesTo?: string[] };
  rarity: string;
  initialStars: number;
  tier: string;
  imageUrl?: string;
  stats: {
    levelStats: Array<{
      level: number;
      totalPower: number;
      hp: number;
      attack: number;
      defense: number;
      critical: number;
    }>;
    level100Overboost?: {
      totalPower: number;
      hp: number;
      attack: number;
      defense: number;
      critical: number;
    };
  };
  skills?: Array<{
    name: string;
    description: string;
    power?: number;
    cooldown?: number;
    damageReductionIgnore?: boolean;
    defenseIgnore?: boolean;
    statusAilment?: string;
    duration?: number;
    extraEffects?: string[];
  }>;
  traits?: Array<{ slot: string; name: string; effect: string }>;
  characterTypes?: Array<{ typeId: string; name: string; effect: string }>;
  teamBoost?: { boostId: string; name: string; effect: string; iconUrl?: string };
  strengths?: string[];
  weaknesses?: string[];
  recommendedMedals?: string[];
  relatedCharacters?: string[];
};

function statRow(label: string, value: number) {
  return (
    <div key={label} className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-data text-sm font-bold">{value.toLocaleString()}</span>
    </div>
  );
}

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [detailResponse, allResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id ?? "")}`),
          fetch(`${API_BASE_URL}/characters`),
        ]);

        if (!detailResponse.ok) {
          setCharacter(null);
          return;
        }

        setCharacter((await detailResponse.json()) as Character);

        if (allResponse.ok) {
          setAllCharacters((await allResponse.json()) as Character[]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  const related = useMemo(() => {
    const ids = new Set(character?.relatedCharacters ?? []);
    return allCharacters.filter((item) => ids.has(item.id));
  }, [allCharacters, character?.relatedCharacters]);

  if (loading) {
    return <GuideShell><PageIntro eyebrow="CHARACTER / LOADING" title="読み込み中…" /></GuideShell>;
  }

  if (error || !character) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="キャラクターが見つかりません"
          description={error || "指定されたデータはまだ登録されていないか、削除されました。"}
          action={<Link href="/characters" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white">一覧に戻る</Link>}
        />
      </GuideShell>
    );
  }

  const levelStats = character.stats?.levelStats ?? [];
  const latestStats = levelStats.length
    ? [...levelStats].sort((a, b) => b.level - a.level)[0]
    : null;

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/characters" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft size={14} /> キャラクター一覧に戻る
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <section className="rounded-md border border-card-border bg-card shadow-card">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                <div className="h-[190px] w-[145px] shrink-0 overflow-hidden rounded-md bg-secondary">
                  {character.imageUrl ? (
                    <img src={character.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-black text-muted-foreground">NO IMAGE</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-2 text-xs text-muted-foreground">{character.reading || "読み未登録"}</div>
                  <h1 className="mb-3 text-3xl font-black leading-tight">{character.name}</h1>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">{character.rarity}</span>
                    <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">{character.role.base}</span>
                    <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">{character.attribute.base}</span>
                    {character.faction && <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">{character.faction}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm font-bold text-primary">評価: <span className="text-lg">{character.tier}</span></div>
                    <div className="text-xs text-muted-foreground">初期★{character.initialStars}</div>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <button
                    onClick={() => setSaved((v) => !v)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${saved ? "bg-primary text-white" : "border border-border bg-background"}`}
                  >
                    <Bookmark size={16} /> {saved ? "保存済み" : "保存"}
                  </button>
                  <button
                    onClick={() => void navigator.clipboard?.writeText(window.location.href)}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold"
                  >
                    <Share2 size={16} /> URLをコピー
                  </button>
                </div>
              </div>
            </section>

            {character.description && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">キャラクター説明</h2>
                <p className="leading-relaxed">{character.description}</p>
              </section>
            )}

            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">ステータス</h2>

              {latestStats ? (
                <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                  {statRow("Lv" + latestStats.level + " 総合力", latestStats.totalPower)}
                  {statRow("HP", latestStats.hp)}
                  {statRow("攻撃", latestStats.attack)}
                  {statRow("防御", latestStats.defense)}
                  {statRow("クリティカル", latestStats.critical)}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">ステータスがまだ登録されていません。</p>
              )}

              {levelStats.length > 1 && (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2">Lv</th>
                        <th className="py-2">総合力</th>
                        <th className="py-2">HP</th>
                        <th className="py-2">攻撃</th>
                        <th className="py-2">防御</th>
                        <th className="py-2">クリティカル</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...levelStats].sort((a, b) => a.level - b.level).map((stat) => (
                        <tr key={stat.level} className="border-b border-border/70 last:border-b-0">
                          <td className="py-2 font-data font-bold">{stat.level}</td>
                          <td className="py-2 font-data">{stat.totalPower.toLocaleString()}</td>
                          <td className="py-2 font-data">{stat.hp.toLocaleString()}</td>
                          <td className="py-2 font-data">{stat.attack.toLocaleString()}</td>
                          <td className="py-2 font-data">{stat.defense.toLocaleString()}</td>
                          <td className="py-2 font-data">{stat.critical}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {(character.tags ?? []).length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">タグ</h2>
                <div className="flex flex-wrap gap-2">
                  {(character.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{tag}</span>
                  ))}
                </div>
              </section>
            )}

            {(character.skills ?? []).length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground"><Zap size={16} /> スキル</h2>
                <div className="space-y-4">
                  {character.skills?.map((skill, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-b-0">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h3 className="font-bold">{skill.name}</h3>
                        {skill.cooldown !== undefined && <span className="text-[10px] font-bold text-muted-foreground">CT: {skill.cooldown}秒</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                      {skill.power !== undefined && <p className="mt-1 text-[10px] font-bold text-primary">威力: {skill.power}%</p>}
                      {(skill.extraEffects ?? []).length > 0 && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{skill.extraEffects?.map((x) => <li key={x}>・{x}</li>)}</ul>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(character.traits ?? []).length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground"><Sword size={16} /> 特性</h2>
                <div className="space-y-4">
                  {character.traits?.map((trait, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-b-0">
                      <div className="text-[10px] font-bold text-primary">{trait.slot}</div>
                      <h3 className="mt-1 font-bold">{trait.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{trait.effect}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-wider text-emerald-600"><Check size={16} /> 強い点</h2>
                {(character.strengths ?? []).length ? (
                  <ul className="space-y-2">{character.strengths?.map((x) => <li key={x} className="text-sm text-muted-foreground">・{x}</li>)}</ul>
                ) : <p className="text-xs text-muted-foreground">未登録</p>}
              </div>
              <div className="rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-wider text-red-600"><Shield size={16} /> 弱い点</h2>
                {(character.weaknesses ?? []).length ? (
                  <ul className="space-y-2">{character.weaknesses?.map((x) => <li key={x} className="text-sm text-muted-foreground">・{x}</li>)}</ul>
                ) : <p className="text-xs text-muted-foreground">未登録</p>}
              </div>
            </section>

            {(character.characterTypes ?? []).length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">キャラクタータイプ</h2>
                <div className="space-y-3">
                  {character.characterTypes?.map((item) => (
                    <div key={item.typeId} className="rounded-md border border-border p-3">
                      <div className="text-sm font-bold">{item.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.effect}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {character.teamBoost && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">チームブースト</h2>
                <div className="text-sm font-bold">{character.teamBoost.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">{character.teamBoost.effect}</p>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground"><Users size={16} /> 関連キャラクター</h2>
                <div className="space-y-2">
                  {related.map((item) => (
                    <Link key={item.id} href={`/characters/${item.id}`} className="flex items-center justify-between rounded-md border border-card-border bg-background p-3 hover:bg-secondary">
                      <div>
                        <div className="text-xs text-muted-foreground">{item.reading}</div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <SidebarCard title="基本情報">
              <div className="space-y-3 text-sm">
                <div><span className="text-xs font-bold text-muted-foreground">ID</span><div className="font-data">{character.id}</div></div>
                <div className="border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">ATTRIBUTE</span><div className="font-bold">{character.attribute.base}</div></div>
                <div className="border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">ROLE</span><div className="font-bold">{character.role.base}</div></div>
                <div className="border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">RARITY</span><div className="font-bold">{character.rarity}</div></div>
                <div className="border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">TIER</span><div className="font-bold text-lg text-primary">{character.tier}</div></div>
              </div>
            </SidebarCard>

            {(character.recommendedMedals ?? []).length > 0 && (
              <SidebarCard title="おすすめメダル">
                <div className="space-y-2">
                  {character.recommendedMedals?.map((medalId) => (
                    <div key={medalId} className="rounded border border-border bg-background px-2.5 py-2 font-data text-[10px]">{medalId}</div>
                  ))}
                </div>
              </SidebarCard>
            )}
          </aside>
        </div>
      </div>
    </GuideShell>
  );
}
