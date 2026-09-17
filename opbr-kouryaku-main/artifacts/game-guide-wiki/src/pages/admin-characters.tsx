import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const ACCESS_TOKEN_KEY = "opbr_access_token";

const ATTRIBUTE_OPTIONS = ["赤", "青", "緑", "黒", "白"] as const;
const ROLE_OPTIONS = ["アタッカー", "ゲッター", "ディフェンダー"] as const;
const RARITY_OPTIONS = [
  "超レジェンダリー",
  "レジェンダリー",
  "恒常",
  "配布",
  "コーラ",
] as const;
const STAR_OPTIONS = [2, 3, 4] as const;
const TIER_OPTIONS = [
  "SS",
  "S+",
  "S",
  "A+",
  "A",
  "B+",
  "B",
  "圏外",
  "評価中",
] as const;

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
  skills?: unknown[];
  traits?: unknown[];
  characterTypes?: unknown[];
  teamBoost?: unknown;
  tier: string;
  imageUrl?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedMedals?: string[];
  relatedCharacters?: string[];
  implementedAt?: string;
};

function lines(value: string): string[] {
  return value.split("\n").map((x) => x.trim()).filter(Boolean);
}

function json(value: string, label: string, fallback: unknown) {
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} のJSON形式が正しくありません`);
  }
}

function makeStatsText(character?: Character) {
  return JSON.stringify(character?.stats ?? {
    levelStats: [
      { level: 1, totalPower: 0, hp: 0, attack: 0, defense: 0, critical: 0 },
      { level: 100, totalPower: 0, hp: 0, attack: 0, defense: 0, critical: 0 },
    ],
  }, null, 2);
}

function makeForm(character?: Character) {
  return {
    id: character?.id ?? "",
    name: character?.name ?? "",
    reading: character?.reading ?? "",
    faction: character?.faction ?? "",
    description: character?.description ?? "",
    tags: (character?.tags ?? []).join("\n"),
    attributeBase: character?.attribute.base ?? "赤",
    attributeChangesTo: (character?.attribute.changesTo ?? []).join(","),
    roleBase: character?.role.base ?? "アタッカー",
    roleChangesTo: (character?.role.changesTo ?? []).join(","),
    rarity: character?.rarity ?? "レジェンダリー",
    initialStars: String(character?.initialStars ?? 4),
    tier: character?.tier ?? "評価中",
    imageUrl: character?.imageUrl ?? "",
    implementedAt: character?.implementedAt?.slice(0, 10) ?? "",
    stats: makeStatsText(character),
    skills: JSON.stringify(character?.skills ?? [], null, 2),
    traits: JSON.stringify(character?.traits ?? [], null, 2),
    characterTypes: JSON.stringify(character?.characterTypes ?? [], null, 2),
    teamBoost: JSON.stringify(character?.teamBoost ?? null, null, 2),
    strengths: (character?.strengths ?? []).join("\n"),
    weaknesses: (character?.weaknesses ?? []).join("\n"),
    recommendedMedals: (character?.recommendedMedals ?? []).join("\n"),
    relatedCharacters: (character?.relatedCharacters ?? []).join("\n"),
  };
}

type FormState = ReturnType<typeof makeForm>;

function Field({ label, value, onChange, type = "text", disabled = false, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-secondary"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function JsonField({ label, value, onChange, rows = 10, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-primary"
      />
    </label>
  );
}

export default function AdminCharactersPage() {
  const [, navigate] = useLocation();
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";

  const [characters, setCharacters] = useState<Character[]>([]);
  const [form, setForm] = useState<FormState>(() => makeForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((c) =>
      `${c.id} ${c.name} ${c.reading ?? ""} ${c.faction ?? ""} ${(c.tags ?? []).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }, [characters, query]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadCharacters() {
    if (!token) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const me = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!me.ok) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        navigate("/auth");
        return;
      }

      const meData = await me.json();
      if (meData?.user?.role !== "admin") {
        setError("管理者権限がありません。");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/characters`);
      if (!response.ok) throw new Error("キャラクター一覧の取得に失敗しました");
      setCharacters((await response.json()) as Character[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCharacters();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(makeForm());
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(character: Character) {
    setEditingId(character.id);
    setForm(makeForm(character));
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeCharacter(character: Character) {
    if (!token) return;

    const ok = window.confirm(
      `「${character.name}」(${character.id})を削除します。この操作は元に戻せません。`,
    );
    if (!ok) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/characters/${encodeURIComponent(character.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `削除に失敗しました (${response.status})`);
      }

      if (editingId === character.id) startCreate();
      setMessage("キャラクターを削除しました。");
      await loadCharacters();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function uploadImage(file: File) {
    if (!token) throw new Error("ログイン情報がありません");

    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      throw new Error("JPEG、PNG、WebP、AVIFのみ対応しています");
    }

    if (file.size > 8 * 1024 * 1024) {
      throw new Error("画像サイズは8MB以下にしてください");
    }

    const contentBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      reader.readAsDataURL(file);
    });

    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : ".webp";

    const safeId = form.id.trim().toLowerCase();
    if (!safeId) throw new Error("先にキャラクターIDを入力してください");

    setUploading(true);

    const response = await fetch(`${API_BASE_URL}/uploads/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        folder: "characters",
        filename: `${safeId}${ext}`,
        contentType: file.type,
        contentBase64,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message ?? `画像アップロードに失敗しました (${response.status})`);
    }

    update("imageUrl", String(data.publicUrl ?? ""));
    setMessage("画像をGitHub assetsリポジトリへアップロードしました。");
    setUploading(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!token) {
        navigate("/auth");
        return;
      }

      if (!form.id.trim() || !form.name.trim()) {
        throw new Error("IDとキャラクター名は必須です");
      }

      const stats = json(form.stats, "ステータス", {
        levelStats: [],
      });

      if (
        typeof stats !== "object" ||
        stats === null ||
        !Array.isArray((stats as { levelStats?: unknown }).levelStats)
      ) {
        throw new Error("ステータスJSONは { levelStats: [...] } 形式にしてください");
      }

      const payload = {
        id: form.id.trim().toLowerCase(),
        name: form.name.trim(),
        reading: form.reading.trim(),
        faction: form.faction.trim(),
        description: form.description.trim(),
        tags: lines(form.tags),
        attribute: {
          base: form.attributeBase,
          changesTo: form.attributeChangesTo
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        },
        role: {
          base: form.roleBase,
          changesTo: form.roleChangesTo
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        },
        rarity: form.rarity,
        initialStars: Number(form.initialStars),
        tier: form.tier,
        imageUrl: form.imageUrl.trim() || undefined,
        implementedAt: form.implementedAt
          ? new Date(`${form.implementedAt}T00:00:00`).toISOString()
          : undefined,
        stats,
        skills: json(form.skills, "スキル", []),
        traits: json(form.traits, "特性", []),
        characterTypes: json(form.characterTypes, "キャラクタータイプ", []),
        teamBoost: form.teamBoost.trim() && form.teamBoost.trim() !== "null"
          ? json(form.teamBoost, "チームブースト", undefined)
          : undefined,
        strengths: lines(form.strengths),
        weaknesses: lines(form.weaknesses),
        recommendedMedals: lines(form.recommendedMedals),
        relatedCharacters: lines(form.relatedCharacters),
      };

      const response = await fetch(
        editingId
          ? `${API_BASE_URL}/characters/${encodeURIComponent(editingId)}`
          : `${API_BASE_URL}/characters`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? `保存に失敗しました (${response.status})`);
      }

      setMessage(editingId ? "キャラクターを更新しました。" : "キャラクターを登録しました。");
      if (!editingId) setForm(makeForm());
      await loadCharacters();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <GuideShell>
      <div className="animate-enter">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} /> 管理画面に戻る
          </Link>

          <button
            type="button"
            onClick={() => void loadCharacters()}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-black hover:bg-secondary"
          >
            <RefreshCw size={14} /> 再読み込み
          </button>
        </div>

        <PageIntro
          eyebrow="ADMIN / CHARACTERS"
          title="キャラクター管理"
          description="MongoDBに保存されているキャラクターを一覧で確認し、追加・編集・削除できます。"
          action={
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-black text-white"
            >
              <Plus size={15} /> 新規登録
            </button>
          }
        />

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-md border border-card-border bg-card p-4 shadow-card">
            <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <Search size={15} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ID、名前、読み、所属、タグで検索"
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>

            {loading ? (
              <p className="py-12 text-center text-xs text-muted-foreground">読み込み中…</p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">キャラクターがありません。</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
                  >
                    {character.imageUrl ? (
                      <img src={character.imageUrl} alt="" className="h-12 w-10 rounded object-cover" />
                    ) : (
                      <div className="grid h-12 w-10 place-items-center rounded bg-secondary text-[9px] font-black text-muted-foreground">
                        NO IMAGE
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-muted-foreground">{character.id}</div>
                      <div className="truncate text-sm font-black">{character.name}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {character.attribute?.base} / {character.role?.base} / {character.tier}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startEdit(character)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                      aria-label={`${character.name}を編集`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCharacter(character)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:border-red-300 hover:text-red-600"
                      aria-label={`${character.name}を削除`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 shrink-0 text-primary" size={18} />
              <div>
                <p className="text-sm font-black">管理者専用</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  ログイン中のJWTをAPIへ送信します。JWTはGitHubやチャットへ貼らないでください。
                </p>
              </div>
            </div>
          </section>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black">{editingId ? `編集: ${editingId}` : "新規キャラクター"}</h2>
              {editingId && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
                >
                  <X size={14} /> 新規登録に戻す
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="ID" value={form.id} onChange={(v) => update("id", v)} disabled={!!editingId} placeholder="例: luffy-gear5" />
              <Field label="キャラクター名" value={form.name} onChange={(v) => update("name", v)} />
              <Field label="読み仮名" value={form.reading} onChange={(v) => update("reading", v)} />
              <Field label="所属" value={form.faction} onChange={(v) => update("faction", v)} />
              <SelectField label="属性" value={form.attributeBase} onChange={(v) => update("attributeBase", v)} options={ATTRIBUTE_OPTIONS} />
              <Field label="属性変化先（カンマ区切り）" value={form.attributeChangesTo} onChange={(v) => update("attributeChangesTo", v)} placeholder="例: 黒" />
              <SelectField label="役職" value={form.roleBase} onChange={(v) => update("roleBase", v)} options={ROLE_OPTIONS} />
              <Field label="役職変化先（カンマ区切り）" value={form.roleChangesTo} onChange={(v) => update("roleChangesTo", v)} placeholder="例: ゲッター" />
              <SelectField label="レアリティ" value={form.rarity} onChange={(v) => update("rarity", v)} options={RARITY_OPTIONS} />
              <SelectField label="初期★" value={form.initialStars} onChange={(v) => update("initialStars", v)} options={STAR_OPTIONS.map(String)} />
              <SelectField label="Tier" value={form.tier} onChange={(v) => update("tier", v)} options={TIER_OPTIONS} />
              <Field label="実装日" type="date" value={form.implementedAt} onChange={(v) => update("implementedAt", v)} />
              <Field label="画像URL" value={form.imageUrl} onChange={(v) => update("imageUrl", v)} placeholder="GitHub assets等の公開URL" />

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black">画像ファイル</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void uploadImage(file).catch((e) => {
                          setUploading(false);
                          setError(e instanceof Error ? e.message : "画像アップロードに失敗しました");
                        });
                        e.currentTarget.value = "";
                      }}
                      className="block w-full text-xs"
                    />
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ImagePlus size={13} /> {uploading ? "アップロード中…" : "最大8MB"}
                    </span>
                  </div>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black">タグ（1行1個）</span>
                  <textarea value={form.tags} onChange={(e) => update("tags", e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black">キャラクター説明</span>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black">ステータス</h2>
            <JsonField
              label="ステータス JSON（levelStats 配列）"
              value={form.stats}
              onChange={(v) => update("stats", v)}
              rows={14}
              placeholder={`{
  "levelStats": [
    {
      "level": 100,
      "totalPower": 0,
      "hp": 0,
      "attack": 0,
      "defense": 0,
      "critical": 0
    }
  ],
  "level100Overboost": {
    "totalPower": 0,
    "hp": 0,
    "attack": 0,
    "defense": 0,
    "critical": 0
  }
}`}
            />
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black">スキル・特性・マスター情報</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <JsonField label="スキル JSON" value={form.skills} onChange={(v) => update("skills", v)} rows={14} />
              <JsonField label="特性 JSON" value={form.traits} onChange={(v) => update("traits", v)} rows={14} />
              <JsonField label="キャラクタータイプ JSON" value={form.characterTypes} onChange={(v) => update("characterTypes", v)} rows={10} />
              <JsonField label="チームブースト JSON（任意）" value={form.teamBoost} onChange={(v) => update("teamBoost", v)} rows={10} placeholder={`null または {
  "boostId": "boost-id",
  "name": "名称",
  "effect": "効果",
  "iconUrl": "https://..."
}`} />
            </div>
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black">攻略情報</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <JsonField label="長所（1行1項目）" value={form.strengths} onChange={(v) => update("strengths", v)} rows={6} />
              <JsonField label="短所（1行1項目）" value={form.weaknesses} onChange={(v) => update("weaknesses", v)} rows={6} />
              <JsonField label="おすすめメダルID（1行1ID）" value={form.recommendedMedals} onChange={(v) => update("recommendedMedals", v)} rows={6} />
              <JsonField label="関連キャラクターID（1行1ID）" value={form.relatedCharacters} onChange={(v) => update("relatedCharacters", v)} rows={6} />
            </div>
          </section>

          {message && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="mr-2 inline" size={17} />{message}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "保存中…" : editingId ? "変更を保存" : "キャラクターを登録"}
            </button>
          </div>
        </form>
      </div>
    </GuideShell>
  );
}
