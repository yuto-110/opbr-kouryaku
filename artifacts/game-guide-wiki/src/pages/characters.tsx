import { useEffect, useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { EmptyState, GuideShell, PageIntro, SidebarCard } from "@/components/guide-shell";
import { CharacterIconOverlay } from "@/components/character-icon-overlay";

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
  tier: string;
  imageUrl?: string;
  characterIconUrl?: string;
  skills?: Array<{ name?: string; skillInfo?: string; description?: string; effectTags?: string[]; statusAilments?: string[] }>;
  initialStars?: number;
  stats?: { level100Overboost?: { totalPower?: number; hp?: number; attack?: number; defense?: number }; levelStats?: Array<{ totalPower: number; hp: number; attack: number; defense: number }> };
};

const roles = ["すべて", "アタッカー", "ゲッター", "ディフェンダー"] as const;
const rarities = ["すべて", "超レジェンダリー", "レジェンダリー", "恒常", "配布", "コーラ"] as const;

function attributeClass(attribute: string) {
  const map: Record<string, string> = {
    赤: "bg-red-500",
    青: "bg-blue-500",
    緑: "bg-emerald-500",
    黒: "bg-slate-900",
    白: "bg-slate-100 border border-border",
  };
  return map[attribute] ?? "bg-secondary";
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <Link
      href={`/characters/${character.id}`}
      className="group flex min-w-0 overflow-hidden rounded-md border border-card-border bg-card shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="relative aspect-square w-[132px] shrink-0 bg-secondary">
        {character.imageUrl ? (
          <img src={character.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-[9px] font-black text-muted-foreground">NO IMAGE</div>
        )}
        {character.characterIconUrl && (
          <CharacterIconOverlay
            imageUrl={character.characterIconUrl}
            className="h-10 w-10"
          />
        )}
        <span className={`absolute right-2 top-2 h-3 w-3 rounded-full ${attributeClass(character.attribute.base)}`} />
      </div>

      <div className="min-w-0 flex-1 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground">{character.reading || "読み未登録"}</div>
            <h3 className="truncate text-sm font-black group-hover:text-primary">{character.name}</h3>
          </div>
          <span className="font-data text-lg font-bold text-primary">{character.tier}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold">{character.rarity}</span>
          <span className="text-[10px] text-muted-foreground">{character.role.base}</span>
          {character.faction && <span className="text-[10px] text-muted-foreground">/ {character.faction}</span>}
        </div>

      </div>
    </Link>
  );
}

export default function CharactersPage() {
  const [location] = useLocation();
  const initialQuery = new URLSearchParams(location.split("?")[1] || "").get("search") || "";

  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState<(typeof roles)[number]>("すべて");
  const [rarity, setRarity] = useState<(typeof rarities)[number]>("すべて");
  const [attribute, setAttribute] = useState("すべて");
  const [sort, setSort] = useState("name");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/characters`);
        if (!response.ok) throw new Error("キャラクターデータを取得できませんでした");
        setCharacters((await response.json()) as Character[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const attributes = useMemo(
    () => ["すべて", ...Array.from(new Set(characters.map((c) => c.attribute.base)))],
    [characters],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return characters
      .filter((c) => {
        const skillSearchText = (c.skills ?? []).map((skill) => `${skill.name ?? ""} ${skill.skillInfo ?? ""} ${skill.description ?? ""} ${(skill.effectTags ?? []).join(" ")} ${(skill.statusAilments ?? []).join(" ")}`).join(" ");
        const haystack = `${c.name} ${c.reading ?? ""} ${c.faction ?? ""} ${(c.tags ?? []).join(" ")} ${skillSearchText}`.toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (role === "すべて" || c.role.base === role) &&
          (rarity === "すべて" || c.rarity === rarity) &&
          (attribute === "すべて" || c.attribute.base === attribute)
        );
      })
      .sort((a, b) => {
        const value = (c: Character, key: "totalPower" | "hp" | "attack" | "defense") => {
          const stats = c.stats?.level100Overboost;
          if (typeof stats?.[key] === "number") return stats[key] as number;
          const rows = c.stats?.levelStats ?? [];
          return rows.length ? Number(rows[rows.length - 1]?.[key] ?? 0) : 0;
        };
        switch (sort) {
          case "attribute": return a.attribute.base.localeCompare(b.attribute.base, "ja");
          case "rarity": return a.rarity.localeCompare(b.rarity, "ja");
          case "role": return a.role.base.localeCompare(b.role.base, "ja");
          case "tier": return a.tier.localeCompare(b.tier, "ja");
          case "initialStars": return (b.initialStars ?? 0) - (a.initialStars ?? 0);
          case "totalPower": return value(b, "totalPower") - value(a, "totalPower");
          case "hp": return value(b, "hp") - value(a, "hp");
          case "attack": return value(b, "attack") - value(a, "attack");
          case "defense": return value(b, "defense") - value(a, "defense");
          default: return a.name.localeCompare(b.name, "ja");
        }
      });
  }, [characters, query, role, rarity, attribute, sort]);

  return (
    <GuideShell>
      <PageIntro
        eyebrow="CHARACTER DATABASE"
        title="キャラクター"
        description="MongoDBに登録されたキャラクターを検索・絞り込みできます。"
        action={
          <div className="hidden items-center gap-2 text-right sm:flex">
            <span className="font-data text-2xl font-semibold text-primary">{filtered.length}</span>
            <span className="text-[10px] text-muted-foreground">RESULTS</span>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <div className="rounded-md border border-card-border bg-card p-3 shadow-card">
            <label className="flex items-center gap-2">
              <Search size={16} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="名前、読み、所属、タグで検索"
                className="w-full bg-transparent text-sm outline-none"
              />
              <span className="font-data text-[10px] text-muted-foreground">{filtered.length}件</span>
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <label className="text-[11px] font-bold text-muted-foreground" htmlFor="character-sort">並び替え</label>
              <select id="character-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-2 text-xs sm:flex-none">
                <option value="name">キャラ名</option><option value="attribute">属性</option><option value="rarity">初期グレード</option><option value="role">スタイル</option><option value="initialStars">初期★（降順）</option><option value="tier">評価ランク</option><option value="totalPower">総合力（降順）</option><option value="hp">体力（降順）</option><option value="attack">攻撃力（降順）</option><option value="defense">防御力（降順）</option>
              </select>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto border-t border-border pt-3">
              {roles.map((item) => (
                <button
                  key={item}
                  onClick={() => setRole(item)}
                  className={`whitespace-nowrap rounded-sm px-2.5 py-1.5 text-[10px] font-bold ${role === item ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-md border border-card-border bg-card py-16 text-center text-xs text-muted-foreground">読み込み中…</div>
          ) : error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</div>
          ) : filtered.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {filtered.map((character) => <CharacterCard key={character.id} character={character} />)}
            </div>
          ) : (
            <div className="mt-4"><EmptyState label="条件に一致するキャラクターが見つかりません" /></div>
          )}
        </div>

        <aside className="space-y-4">
          <SidebarCard title="絞り込み">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold text-primary"><Filter size={14} />詳細フィルター</div>

            <label className="block text-[10px] font-bold text-muted-foreground">
              属性
              <select value={attribute} onChange={(e) => setAttribute(e.target.value)} className="mt-1 w-full rounded-sm border border-border bg-background p-2 text-xs font-bold outline-none">
                {attributes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="mt-4 block text-[10px] font-bold text-muted-foreground">
              レアリティ
              <select value={rarity} onChange={(e) => setRarity(e.target.value as (typeof rarities)[number])} className="mt-1 w-full rounded-sm border border-border bg-background p-2 text-xs font-bold outline-none">
                {rarities.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="mt-4 block text-[10px] font-bold text-muted-foreground">
              並び順
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1 w-full rounded-sm border border-border bg-background p-2 text-xs font-bold outline-none">
                <option value="name">名前順</option>
                <option value="tier">Tier順</option>
              </select>
            </label>

            <button
              onClick={() => {
                setQuery("");
                setRole("すべて");
                setRarity("すべて");
                setAttribute("すべて");
                setSort("name");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 border-t border-border pt-3 text-[10px] font-bold text-muted-foreground hover:text-primary"
            >
              <SlidersHorizontal size={13} /> 条件をリセット
            </button>
          </SidebarCard>
        </aside>
      </div>
    </GuideShell>
  );
}
