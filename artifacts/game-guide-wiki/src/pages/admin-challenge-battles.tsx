import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, Plus, Save, Pencil, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";
const TOKEN_KEY = "opbr_access_token";

type RewardItem = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  active: boolean;
};

type Reward = { itemId: string; quantity: number };
type ScoreReward = {
  score: number;
  normalRewards: Reward[];
  passRewards: Reward[];
};

type Battle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  overview: string;
  rules: string;
  scoreRewards: ScoreReward[];
  active: boolean;
};

type ItemForm = { name: string; imageUrl: string; description: string };
type BattleForm = Omit<Battle, "id" | "active">;

const emptyItem = (): ItemForm => ({ name: "", imageUrl: "", description: "" });
const emptyBattle = (): BattleForm => ({
  name: "",
  startDate: "",
  endDate: "",
  overview: "",
  rules: "",
  scoreRewards: [{ score: 0, normalRewards: [], passRewards: [] }],
});

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function toDateInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminChallengeBattlesPage() {
  const [, navigate] = useLocation();
  const token = localStorage.getItem(TOKEN_KEY) ?? "";
  const headers = { Authorization: `Bearer ${token}` };

  const [items, setItems] = useState<RewardItem[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem());
  const [battleForm, setBattleForm] = useState<BattleForm>(emptyBattle());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingBattleId, setEditingBattleId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!token) {
      navigate("/auth");
      return;
    }
    const meResponse = await fetch(`${API_BASE_URL}/users/me`, { headers });
    const me = await meResponse.json().catch(() => null);
    if (!meResponse.ok || me?.user?.role !== "admin") {
      navigate("/admin");
      return;
    }

    const [itemResponse, battleResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/challenge-reward-items`, { headers }),
      fetch(`${API_BASE_URL}/admin/challenge-battles`, { headers }),
    ]);
    if (!itemResponse.ok || !battleResponse.ok) {
      throw new Error("チャレバト管理データの取得に失敗しました");
    }
    setItems(await itemResponse.json() as RewardItem[]);
    setBattles(await battleResponse.json() as Battle[]);
  }

  useEffect(() => {
    void load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "読み込みに失敗しました"),
    );
  }, []);

  async function uploadImage(file: File) {
    const response = await fetch(`${API_BASE_URL}/uploads/github`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: "characters",
        filename: `challenge-reward-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
        contentType: file.type,
        contentBase64: await fileToBase64(file),
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message ?? "画像アップロードに失敗しました");
    return String(data.publicUrl ?? "");
  }

  async function saveItem() {
    setError("");
    setMessage("");
    if (!itemForm.name.trim()) {
      setError("報酬アイテム名を入力してください");
      return;
    }
    try {
      const imageUrl = imageFile ? await uploadImage(imageFile) : itemForm.imageUrl;
      const response = await fetch(
        editingItemId
          ? `${API_BASE_URL}/admin/challenge-reward-items/${editingItemId}`
          : `${API_BASE_URL}/admin/challenge-reward-items`,
        {
          method: editingItemId ? "PUT" : "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ ...itemForm, imageUrl }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "報酬アイテムの保存に失敗しました");
      setItemForm(emptyItem());
      setImageFile(null);
      setEditingItemId(null);
      setMessage("報酬アイテムを保存しました");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存に失敗しました");
    }
  }

  async function remove(path: string) {
    if (!window.confirm("このデータを削除しますか？")) return;
    const response = await fetch(`${API_BASE_URL}/admin/${path}`, {
      method: "DELETE",
      headers,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.message ?? "削除に失敗しました");
      return;
    }
    setMessage("削除しました");
    await load();
  }

  function editItem(item: RewardItem) {
    setEditingItemId(item.id);
    setItemForm({ name: item.name, imageUrl: item.imageUrl, description: item.description });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editBattle(battle: Battle) {
    setEditingBattleId(battle.id);
    setBattleForm({
      name: battle.name,
      startDate: toDateInput(battle.startDate),
      endDate: toDateInput(battle.endDate),
      overview: battle.overview ?? "",
      rules: battle.rules ?? "",
      scoreRewards: (battle.scoreRewards ?? []).map((tier) => ({
        score: tier.score,
        normalRewards: (tier.normalRewards ?? []).map((reward) => ({
          itemId: reward.itemId,
          quantity: reward.quantity,
        })),
        passRewards: (tier.passRewards ?? []).map((reward) => ({
          itemId: reward.itemId,
          quantity: reward.quantity,
        })),
      })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateTier(index: number, patch: Partial<ScoreReward>) {
    setBattleForm((current) => ({
      ...current,
      scoreRewards: current.scoreRewards.map((tier, i) => i === index ? { ...tier, ...patch } : tier),
    }));
  }

  function updateReward(tierIndex: number, type: "normalRewards" | "passRewards", rewardIndex: number, patch: Partial<Reward>) {
    setBattleForm((current) => ({
      ...current,
      scoreRewards: current.scoreRewards.map((tier, i) => i !== tierIndex ? tier : {
        ...tier,
        [type]: tier[type].map((reward, j) => j === rewardIndex ? { ...reward, ...patch } : reward),
      }),
    }));
  }

  function addReward(tierIndex: number, type: "normalRewards" | "passRewards") {
    const firstItem = items.find((item) => item.active);
    if (!firstItem) {
      setError("先に報酬アイテムを登録してください");
      return;
    }
    updateTier(tierIndex, {
      [type]: [...battleForm.scoreRewards[tierIndex][type], { itemId: firstItem.id, quantity: 1 }],
    });
  }

  function removeReward(tierIndex: number, type: "normalRewards" | "passRewards", rewardIndex: number) {
    updateTier(tierIndex, {
      [type]: battleForm.scoreRewards[tierIndex][type].filter((_, i) => i !== rewardIndex),
    });
  }

  async function saveBattle() {
    setError("");
    setMessage("");
    if (!battleForm.name.trim() || !battleForm.startDate || !battleForm.endDate) {
      setError("イベント名と開催期間を入力してください");
      return;
    }
    if (new Date(battleForm.endDate) < new Date(battleForm.startDate)) {
      setError("終了日時は開始日時以降にしてください");
      return;
    }

    const payload = {
      ...battleForm,
      startDate: new Date(battleForm.startDate).toISOString(),
      endDate: new Date(battleForm.endDate).toISOString(),
      scoreRewards: [...battleForm.scoreRewards].sort((a, b) => a.score - b.score),
    };

    try {
      const response = await fetch(
        editingBattleId
          ? `${API_BASE_URL}/admin/challenge-battles/${editingBattleId}`
          : `${API_BASE_URL}/admin/challenge-battles`,
        {
          method: editingBattleId ? "PUT" : "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "チャレバトの保存に失敗しました");
      setMessage("チャレバトを保存しました");
      setBattleForm(emptyBattle());
      setEditingBattleId(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存に失敗しました");
    }
  }

  const totals = (type: "normalRewards" | "passRewards") => {
    const counts = new Map<string, number>();
    for (const tier of battleForm.scoreRewards) {
      for (const reward of tier[type]) {
        counts.set(reward.itemId, (counts.get(reward.itemId) ?? 0) + Math.max(0, Number(reward.quantity) || 0));
      }
    }
    return [...counts.entries()].map(([itemId, quantity]) => ({
      item: items.find((candidate) => candidate.id === itemId),
      itemId,
      quantity,
    }));
  };

  return (
    <GuideShell>
      <Link href="/admin" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
        <ArrowLeft size={14} /> 管理画面に戻る
      </Link>
      <PageIntro eyebrow="ADMIN / CHALLENGE BATTLE" title="チャレバト管理" description="報酬アイテム、スコア報酬、開催期間を登録・編集します。終了済みイベントも保存され、後から閲覧できます。" />

      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}

      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-black">{editingItemId ? "報酬アイテムを編集" : "報酬アイテムを登録"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-bold">アイテム名
            <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
          <label className="text-sm font-bold">画像ファイル
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs" />
            <input value={itemForm.imageUrl} onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })} placeholder="画像URL（直接入力も可）" className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-xs" />
          </label>
          <label className="text-sm font-bold md:col-span-2">説明
            <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1 min-h-16 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => void saveItem()} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white"><Save size={14} />保存</button>
          {editingItemId ? <button onClick={() => { setEditingItemId(null); setItemForm(emptyItem()); setImageFile(null); }} className="rounded border border-border px-3 py-2 text-xs"><X size={14} className="inline" /> キャンセル</button> : null}
        </div>
      </section>

      <section className="mt-5 space-y-2">
        <h2 className="text-lg font-black">登録済み報酬アイテム（{items.length}件）</h2>
        {items.map((item) => (
          <div key={item.id} className={`flex items-center justify-between gap-3 rounded-md border border-card-border bg-card p-3 ${!item.active ? "opacity-50" : ""}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-secondary">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : null}
              </div>
              <div className="min-w-0"><b>{item.name}</b><p className="text-xs text-muted-foreground">{item.description}</p>{!item.active ? <p className="text-xs text-red-600">無効</p> : null}</div>
            </div>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => editItem(item)} aria-label="編集" className="text-primary"><Pencil size={16} /></button>
              {item.active ? <button onClick={() => void remove(`challenge-reward-items/${item.id}`)} aria-label="無効化" className="text-red-600"><Trash2 size={16} /></button> : null}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-black">{editingBattleId ? "チャレバトを編集" : "チャレバトを登録"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-bold">イベント名
            <input value={battleForm.name} onChange={(e) => setBattleForm({ ...battleForm, name: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
          <label className="text-sm font-bold">開始日時
            <input type="datetime-local" value={battleForm.startDate} onChange={(e) => setBattleForm({ ...battleForm, startDate: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
          <label className="text-sm font-bold">終了日時
            <input type="datetime-local" value={battleForm.endDate} onChange={(e) => setBattleForm({ ...battleForm, endDate: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
          <label className="text-sm font-bold md:col-span-2">概要
            <textarea value={battleForm.overview} onChange={(e) => setBattleForm({ ...battleForm, overview: e.target.value })} className="mt-1 min-h-16 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
          <label className="text-sm font-bold md:col-span-2">ルール
            <textarea value={battleForm.rules} onChange={(e) => setBattleForm({ ...battleForm, rules: e.target.value })} className="mt-1 min-h-16 w-full rounded border border-border bg-background px-3 py-2" />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h3 className="text-base font-black">スコア別報酬</h3>
          <button onClick={() => setBattleForm((current) => ({ ...current, scoreRewards: [...current.scoreRewards, { score: 0, normalRewards: [], passRewards: [] }] }))} className="inline-flex items-center gap-1 rounded border border-primary px-3 py-2 text-xs font-bold text-primary"><Plus size={14} />スコア段階を追加</button>
        </div>

        {battleForm.scoreRewards.map((tier, tierIndex) => (
          <div key={tierIndex} className="mt-4 rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold">必要スコア
                <input type="number" min="0" value={tier.score} onChange={(e) => updateTier(tierIndex, { score: Number(e.target.value) })} className="ml-2 w-36 rounded border border-border bg-background px-3 py-2" />
              </label>
              <button onClick={() => setBattleForm((current) => ({ ...current, scoreRewards: current.scoreRewards.filter((_, i) => i !== tierIndex) }))} className="text-xs text-red-600"><Trash2 size={14} className="inline" /> 段階を削除</button>
            </div>

            {([
              ["normalRewards", "通常報酬"],
              ["passRewards", "パス報酬"],
            ] as const).map(([type, label]) => (
              <div key={type} className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-black">{label}</h4>
                  <button onClick={() => addReward(tierIndex, type)} className="inline-flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs font-bold text-primary"><Plus size={13} />報酬追加</button>
                </div>
                <div className="space-y-2">
                  {tier[type].map((reward, rewardIndex) => (
                    <div key={rewardIndex} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                      <select value={reward.itemId} onChange={(e) => updateReward(tierIndex, type, rewardIndex, { itemId: e.target.value })} className="min-w-0 rounded border border-border bg-background px-2 py-2 text-sm">
                        {items.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                      <label className="text-xs font-bold">個数
                        <input type="number" min="1" value={reward.quantity} onChange={(e) => updateReward(tierIndex, type, rewardIndex, { quantity: Number(e.target.value) })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" />
                      </label>
                      <button onClick={() => removeReward(tierIndex, type, rewardIndex)} aria-label="報酬を削除" className="self-center text-red-600"><X size={17} /></button>
                    </div>
                  ))}
                  {tier[type].length === 0 ? <p className="text-xs text-muted-foreground">報酬未登録</p> : null}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {([
            ["normalRewards", "通常報酬の合計"],
            ["passRewards", "パス報酬の合計"],
          ] as const).map(([type, title]) => (
            <div key={type} className="rounded-md bg-secondary/50 p-4">
              <h4 className="mb-2 font-black">{title}</h4>
              {totals(type).length ? totals(type).map(({ item, itemId, quantity }) => (
                <div key={itemId} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span>{item?.name ?? itemId}</span><b>×{quantity}</b>
                </div>
              )) : <p className="text-xs text-muted-foreground">まだ報酬がありません</p>}
              <p className="mt-2 text-xs text-muted-foreground">登録された全スコア段階の数量を合算しています。</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => void saveBattle()} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white"><Save size={14} />チャレバトを保存</button>
          {editingBattleId ? <button onClick={() => { setEditingBattleId(null); setBattleForm(emptyBattle()); }} className="rounded border border-border px-3 py-2 text-xs">編集をキャンセル</button> : null}
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-black">登録済みチャレバト（{battles.length}件）</h2>
        {battles.map((battle) => (
          <div key={battle.id} className={`rounded-md border border-card-border bg-card p-4 shadow-card ${!battle.active ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{battle.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(battle.startDate).toLocaleString("ja-JP")} ～ {new Date(battle.endDate).toLocaleString("ja-JP")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{battle.scoreRewards.length}段階のスコア報酬{!battle.active ? "・無効" : ""}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => editBattle(battle)} aria-label="編集" className="text-primary"><Pencil size={16} /></button>
                {battle.active ? <button onClick={() => void remove(`challenge-battles/${battle.id}`)} aria-label="無効化" className="text-red-600"><Trash2 size={16} /></button> : null}
              </div>
            </div>
          </div>
        ))}
      </section>
    </GuideShell>
  );
}
