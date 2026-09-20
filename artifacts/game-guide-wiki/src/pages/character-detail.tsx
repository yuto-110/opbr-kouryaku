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
import { CharacterTagHexList } from "@/components/character-tag-hex-list";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const TOKEN_KEY = "opbr_access_token";

type CharacterTagMaster = {
  id: string;
  name: string;
  supportCategory?: string;
  supportEffect?: string;
  levels?: Array<{ level: number; totalLevel: number; effect: string }>;
};

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
  characterIconUrl?: string;
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
  doubleCharacters?: string[];
  skills?: Array<{
    skillSlot?: "スキル1" | "スキル2" | "その他";
    targetCharacter?: string;
    variantOrder?: number;
    imageUrl?: string;
    skillType?: string;
    name: string;
    skillInfo?: string;
    description: string;
    power?: number;
    cooldown?: number;
    damageReductionIgnore?: boolean;
    defenseIgnore?: boolean;
    statusAilment?: string;
    statusAilments?: string[];
    effectTags?: string[];
    duration?: number;
    extraEffects?: string[];
    stages?: Array<{ label?: string; power?: number; cooldown?: number; effect?: string; effects?: string[]; details?: Array<{ label: string; value: string }> }>;
    changeFromSkillIndex?: number;
    changeCondition?: string;
    changeDuration?: number;
  }>;
  traits?: Array<{ slot: string; target?: string; traitName?: string; name?: string; effect?: string; effects?: string[] }>;
  characterTypes?: Array<{ typeId: string; name: string; effect: string }>;
  teamBoost?: { boostId: string; name: string; effect: string; iconUrl?: string };
  strengths?: string[];
  weaknesses?: string[];
  recommendedMedals?: string[];
  relatedCharacters?: string[];
};


function SkillPresentation({ skills }: { skills: NonNullable<Character["skills"]> }) {
  const slots = ["スキル1", "スキル2", "その他"] as const;
  return (
    <div className="space-y-7">
      {slots.map((slot) => {
        const slotSkills = skills.filter((skill) => (skill.skillSlot ?? "その他") === slot);
        if (!slotSkills.length) return null;
        const targets = Array.from(new Set(slotSkills.map((skill) => skill.targetCharacter || "共通")));
        return <SkillGroup key={slot} title={slot} skills={slotSkills} targets={targets} />;
      })}
    </div>
  );
}

function SkillGroup({
  title,
  skills,
  targets,
}: {
  title: string;
  skills: NonNullable<Character["skills"]>;
  targets: string[];
}) {
  const [target, setTarget] = useState(targets[0] ?? "共通");
  const targetSkills = skills
    .filter((skill) => (skill.targetCharacter || "共通") === target)
    .sort((a, b) => (a.variantOrder ?? 0) - (b.variantOrder ?? 0));

  const [variantIndex, setVariantIndex] = useState(0);

  useEffect(() => {
    setVariantIndex(0);
  }, [target]);

  const active =
    targetSkills[
      Math.min(variantIndex, Math.max(0, targetSkills.length - 1))
    ] ?? targetSkills[0];

  if (!active) return null;

  const variants = targetSkills.map((skill, index) => ({
    skill,
    index,
  }));

  const labelFor = (
    skill: NonNullable<Character["skills"]>[number],
  ) => {
    if (skill.skillType === "EVスキル") {
      return `EVスキル${skill.variantOrder ?? 1}`;
    }

    if (skill.skillType === "コンボスキル") {
      return "コンボスキル";
    }

    if (skill.skillType === "奪取中カウンタースキル") {
      return "奪取中カウンター";
    }

    return title;
  };

  return (
    <section className="overflow-hidden rounded-md border border-card-border bg-card shadow-card">
      {/* ダブルキャラなどの対象切り替え */}
      {targets.length > 1 && (
        <div className="border-b border-border bg-secondary/50 p-2">
          <div className="flex overflow-x-auto">
            {targets.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTarget(item)}
                className={`min-w-32 border-b-2 px-4 py-2 text-sm font-black ${
                  target === item
                    ? "border-primary bg-primary text-white"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* スキル名 */}
      <div className="border-b-2 border-primary/40 px-5 py-4">
        <h3 className="text-xl font-black">
          {title}「{active.name}」
        </h3>
      </div>

      {/* EVスキルなどの切り替え */}
      {variants.length > 1 && (
        <div className="flex overflow-x-auto border-b border-border bg-background px-3 pt-2">
          {variants.map(({ skill, index }) => (
            <button
              key={`${skill.name}-${index}`}
              type="button"
              onClick={() => setVariantIndex(index)}
              className={`rounded-t-md border px-4 py-2 text-xs font-black ${
                index === variantIndex
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-primary"
              }`}
            >
              {labelFor(skill)}
            </button>
          ))}
        </div>
      )}

      {/* スキル本体 */}
      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-md border border-border">
          {/* アイコン + スキル情報 */}
          <div className="flex min-w-0 items-start gap-4 p-4 sm:p-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-muted sm:h-24 sm:w-24">
              {active.imageUrl ? (
                <img
                  src={active.imageUrl}
                  alt=""
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="text-[9px] font-bold text-muted-foreground">
                  SKILL ICON
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="whitespace-pre-line text-sm font-black leading-7 sm:text-base">
                {active.skillInfo || "スキル情報未登録"}
              </div>

              {/* 効果タグ */}
              {active.effectTags?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.effectTags.map((tag) => (
                    <span
                      key={`effect-${tag}`}
                      className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* 状態異常タグ */}
              {active.statusAilments?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {active.statusAilments.map((tag) => (
                    <span
                      key={`status-${tag}`}
                      className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* 詳細 */}
          <div className="border-t border-border p-4 sm:p-5">
            <div className="mb-2 text-xs font-black text-muted-foreground">
              詳細
            </div>

            <div className="whitespace-pre-line text-sm leading-7">
              {active.description || "詳細未登録"}
            </div>
          </div>
        </div>

        {/* スキル変化条件・時間
            ※ここは既存仕様を維持 */}
        {(active.changeCondition ||
          active.changeDuration !== undefined) && (
          <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-6">
            <b>スキル変化条件</b>
            {active.changeCondition
              ? `：${active.changeCondition}`
              : ""}
            {active.changeDuration !== undefined
              ? `（${active.changeDuration}秒）`
              : ""}
          </div>
        )}

        {/* その他の効果 */}
        {active.extraEffects?.length ? (
          <div className="mt-3 space-y-1 text-sm">
            {active.extraEffects.map((effect) => (
              <div key={effect}>・{effect}</div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TraitPresentation({
  traits,
}: {
  traits: NonNullable<Character["traits"]>;
}) {
  const targets = Array.from(
    new Set(traits.map((trait) => trait.target || "共通")),
  );
  const [target, setTarget] = useState(targets[0] ?? "共通");

  const targetTraits = traits.filter(
    (trait) => (trait.target || "共通") === target,
  );

  return (
    <div className="space-y-4">
      {targets.length > 1 && (
        <div className="flex overflow-x-auto rounded-md border border-border">
          {targets.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTarget(item)}
              className={`min-w-32 border-b-2 px-4 py-2 text-sm font-black ${
                target === item
                  ? "border-primary bg-primary text-white"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {targetTraits.map((trait, index) => {
        const effects = trait.effects?.length
          ? trait.effects
          : [trait.effect ?? ""].filter(Boolean);

        return (
          <div
            key={`${trait.name}-${index}`}
            className="rounded-md border border-border bg-background p-4"
          >
            <h3 className="text-sm font-black">{trait.name}</h3>

            {effects.length > 0 && (
              <div className="mt-2 space-y-1 text-sm leading-7">
                {effects.map((effect, effectIndex) => (
                  <div key={`${effect}-${effectIndex}`}>・{effect}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const [tagMasters, setTagMasters] = useState<CharacterTagMaster[]>([]);
  const [selectedTag, setSelectedTag] = useState<CharacterTagMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [detailResponse, allResponse, tagResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id ?? "")}`),
          fetch(`${API_BASE_URL}/characters`),
          fetch(`${API_BASE_URL}/character-tags`),
        ]);

        if (!detailResponse.ok) {
          setCharacter(null);
          return;
        }

        const detail = (await detailResponse.json()) as Character;
        setCharacter(detail);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(TOKEN_KEY)
            : null;

        if (token) {
          const meResponse = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (meResponse.ok) {
            const meData = await meResponse.json();
            setOwned(
              (meData.ownedCharacters ?? []).some(
                (item: { characterId: string }) =>
                  item.characterId === detail.id,
              ),
            );
            setFavorite(
              (meData.favoriteCharacters ?? []).includes(detail.id),
            );
          }
        }

        if (allResponse.ok) {
          setAllCharacters((await allResponse.json()) as Character[]);
        }

        if (tagResponse.ok) {
          setTagMasters((await tagResponse.json()) as CharacterTagMaster[]);
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
  const overboostStats = character.stats?.level100Overboost ?? null;
  const latestStats = levelStats.length
    ? [...levelStats].sort((a, b) => b.level - a.level)[0]
    : null;

  const getRank = (
    field: "totalPower" | "hp" | "attack" | "defense",
    value: number,
  ) => {
    const higher = allCharacters.filter((item) => {
      const stats = [...(item.stats?.levelStats ?? [])].sort(
        (a, b) => b.level - a.level,
      )[0];
      return typeof stats?.[field] === "number" && stats[field] > value;
    }).length;
    return `全体で${higher + 1}位/${allCharacters.length}`;
  };

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
                <div className="relative aspect-square w-[190px] max-w-full shrink-0 overflow-hidden rounded-md bg-secondary">
                  {character.imageUrl ? (
                    <img src={character.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-black text-muted-foreground">NO IMAGE</div>
                  )}
                  <CharacterTagHexList
                    tags={character.tags ?? []}
                    className="absolute left-2 top-2 z-10 max-w-[calc(100%-0.5rem)]"
                    onTagClick={(tag) =>
                      setSelectedTag(
                        tagMasters.find((item) => item.name === tag) ?? {
                          id: `missing-${tag}`,
                          name: tag,
                          supportCategory: "未登録",
                          supportEffect: "このタグの詳細はまだ登録されていません。",
                          levels: [],
                        },
                      )
                    }
                  />
                  {character.characterIconUrl && (
                    <img
                      src={character.characterIconUrl}
                      alt=""
                      className="absolute left-2 top-2 z-10 h-14 w-14 object-contain"
                    />
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
                  {(character.doubleCharacters ?? []).length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-sm bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">ダブルキャラ</span>
                      {character.doubleCharacters?.map((name) => (
                        <span key={name} className="rounded-sm border border-border bg-secondary px-2 py-1 text-[10px] font-bold">{name}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm font-bold text-primary">評価: <span className="text-lg">{character.tier}</span></div>
                    <div className="text-xs text-muted-foreground">初期★{character.initialStars}</div>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <button
                    disabled={actionLoading}
                    onClick={async () => {
                      const token = localStorage.getItem(TOKEN_KEY);
                      if (!token) {
                        window.location.href = "/auth";
                        return;
                      }
                      setActionLoading(true);
                      try {
                        const response = await fetch(
                          owned
                            ? `${API_BASE_URL}/users/me/characters/${encodeURIComponent(character.id)}`
                            : `${API_BASE_URL}/users/me/characters`,
                          owned
                            ? {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            : {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ characterId: character.id }),
                              },
                        );
                        if (!response.ok && response.status !== 409) {
                          const data = await response.json().catch(() => null);
                          throw new Error(data?.message ?? "所持状況の更新に失敗しました");
                        }
                        setOwned(!owned);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "所持状況の更新に失敗しました");
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${owned ? "bg-primary text-white" : "border border-border bg-background"}`}
                  >
                    <Check size={16} /> {owned ? "所持中" : "未所持"}
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={async () => {
                      const token = localStorage.getItem(TOKEN_KEY);
                      if (!token) {
                        window.location.href = "/auth";
                        return;
                      }
                      setActionLoading(true);
                      try {
                        const response = await fetch(
                          `${API_BASE_URL}/users/me/favorites/${encodeURIComponent(character.id)}`,
                          {
                            method: favorite ? "DELETE" : "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        if (!response.ok) {
                          const data = await response.json().catch(() => null);
                          throw new Error(data?.message ?? "お気に入りの更新に失敗しました");
                        }
                        setFavorite(!favorite);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "お気に入りの更新に失敗しました");
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${favorite ? "bg-yellow-500 text-white" : "border border-border bg-background"}`}
                  >
                    <Bookmark size={16} fill={favorite ? "currentColor" : "none"} />
                    {favorite ? "お気に入り済み" : "お気に入り"}
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

              {latestStats || overboostStats || character.stats ? (
                <>
                  {latestStats ? (
                    <div className="mb-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                      {statRow("Lv" + latestStats.level + " 総合力 " + getRank("totalPower", latestStats.totalPower), latestStats.totalPower)}
                      {statRow("体力 " + getRank("hp", latestStats.hp), latestStats.hp)}
                      {statRow("攻撃 " + getRank("attack", latestStats.attack), latestStats.attack)}
                      {statRow("防御 " + getRank("defense", latestStats.defense), latestStats.defense)}
                      {statRow("クリティカル", latestStats.critical)}
                    </div>
                  ) : null}
                  {overboostStats ? (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                      <div className="mb-3 text-xs font-black text-primary">Lv100超過ブースト最大時</div>
                      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                        {statRow("総合力", overboostStats.totalPower)}
                        {statRow("体力", overboostStats.hp)}
                        {statRow("攻撃", overboostStats.attack)}
                        {statRow("防御", overboostStats.defense)}
                        {statRow("クリティカル", overboostStats.critical)}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">ステータスの数値がまだ登録されていません。</p>
              )}

              {levelStats.length > 1 && (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2">Lv</th>
                        <th className="py-2">総合力</th>
                        <th className="py-2">体力</th>
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
                <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">キャラタグ</h2>
                <div className="flex flex-wrap gap-2">
                  {(character.tags ?? []).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTag(
                          tagMasters.find((item) => item.name === tag) ?? {
                            id: `missing-${tag}`,
                            name: tag,
                            supportCategory: "未登録",
                            supportEffect: "このタグの詳細はまだ登録されていません。",
                            levels: [],
                          },
                        )
                      }
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {(character.skills ?? []).length > 0 && (
              <section className="mt-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground"><Zap size={16} /> スキル</h2>
                <SkillPresentation skills={character.skills ?? []} />
              </section>
            )}

            {(character.traits ?? []).length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground"><Sword size={16} /> 特性</h2>
                <TraitPresentation traits={character.traits ?? []} />
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

      {selectedTag && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setSelectedTag(null)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-card-border bg-card p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="data-label mb-1">CHARACTER TAG</div>
                <h2 className="break-words text-xl font-black leading-tight">{selectedTag.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedTag(null)}
                className="rounded-md border border-border px-3 py-1 text-xs font-bold">閉じる</button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-xs font-black text-muted-foreground">サポートカテゴリ</div>
                <p className="break-words text-sm">{selectedTag.supportCategory || "未登録"}</p>
              </div>
              <div>
                <div className="mb-1 text-xs font-black text-muted-foreground">サポート効果</div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{selectedTag.supportEffect || "未登録"}</p>
              </div>
              {(selectedTag.levels ?? []).length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-black text-muted-foreground">タグLv</div>
                  <div className="overflow-hidden rounded-md border border-border">
                    {(selectedTag.levels ?? []).map((level) => (
                      <div key={level.level} className="grid gap-2 border-b border-border p-3 text-xs last:border-b-0 sm:grid-cols-[64px_100px_minmax(0,1fr)]">
                        <span className="font-black">Lv{level.level}</span>
                        <span className="font-data">累計Lv{level.totalLevel}</span>
                        <span className="min-w-0 break-words">{level.effect || "未登録"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </GuideShell>
  );
}
