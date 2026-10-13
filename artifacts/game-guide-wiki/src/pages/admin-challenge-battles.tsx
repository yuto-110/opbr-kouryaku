
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, Plus, Save, Pencil, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";
const TOKEN_KEY = "opbr_access_token";

type RewardItem = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  active: boolean;
};

type Reward = {
  itemId: string;
  quantity: number | "";
};

type ScoreReward = {
  score: number | "";
  normalRewards: Reward[];
  passLiteRewards: Reward[];
  passPremiumRewards: Reward[];
  passRewards?: Reward[];
};

type RankingReward = {
  rankFrom: number | "";
  rankTo: number | "";
  rewards: Reward[];
};

type Battle = {
  id: string;
  name: string;
  bannerImageUrl: string;
  startDate: string;
  endDate: string;
  overview: string;
  rules: string;
  scoreRewards: ScoreReward[];
  rankingRewards: RankingReward[];
  active: boolean;
};

type ItemForm = {
  name: string;
  imageUrl: string;
  description: string;
};

type BattleForm = Omit<Battle, "id" | "active">;
type RewardType =
  | "normalRewards"
  | "passLiteRewards"
  | "passPremiumRewards";

const rewardTypes: { value: RewardType; label: string }[] = [
  { value: "normalRewards", label: "通常報酬" },
  { value: "passLiteRewards", label: "Event Pass Lite報酬" },
  { value: "passPremiumRewards", label: "Event Pass Premium報酬" },
];

const emptyItem = (): ItemForm => ({
  name: "",
  imageUrl: "",
  description: "",
});

const emptyBattle = (): BattleForm => ({
  name: "",
  bannerImageUrl: "",
  startDate: "",
  endDate: "",
  overview: "",
  rules: "",
  scoreRewards: [
    {
      score: "",
      normalRewards: [],
      passLiteRewards: [],
      passPremiumRewards: [],
    },
  ],
  rankingRewards: [],
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

function normalizeRewards(rewards?: Reward[]): Reward[] {
  return (rewards ?? []).map((reward) => ({
    itemId: reward.itemId,
    quantity: reward.quantity,
  }));
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
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
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

    setItems((await itemResponse.json()) as RewardItem[]);
    setBattles((await battleResponse.json()) as Battle[]);
  }

  useEffect(() => {
    void load().catch((reason: unknown) =>
      setError(
        reason instanceof Error ? reason.message : "読み込みに失敗しました",
      ),
    );
  }, []);

  async function uploadImage(file: File, prefix: string) {
    const response = await fetch(`${API_BASE_URL}/uploads/github`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: "characters",
        filename: `${prefix}-${Date.now()}-${file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-",
        )}`,
        contentType: file.type,
        contentBase64: await fileToBase64(file),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message ?? "画像アップロードに失敗しました");
    }

    const url = String(data?.publicUrl ?? "");
    if (!url) throw new Error("画像URLを取得できませんでした");

    return url;
  }

  async function saveItem() {
    setError("");
    setMessage("");

    if (!itemForm.name.trim()) {
      setError("報酬アイテム名を入力してください");
      return;
    }

    try {
      const imageUrl = imageFile
        ? await uploadImage(imageFile, "challenge-reward")
        : itemForm.imageUrl;

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

      if (!response.ok) {
        throw new Error(data?.message ?? "報酬アイテムの保存に失敗しました");
      }

      setItemForm(emptyItem());
      setImageFile(null);
      setEditingItemId(null);
      setMessage("報酬アイテムを保存しました");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "保存に失敗しました",
      );
    }
  }

  async function remove(path: string) {
    if (!window.confirm("このデータを削除しますか？")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/${path}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? "削除に失敗しました");
      }

      setMessage("削除しました");
      setError("");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "削除に失敗しました",
      );
    }
  }

  function editItem(item: RewardItem) {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      imageUrl: item.imageUrl ?? "",
      description: item.description ?? "",
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editBattle(battle: Battle) {
    setEditingBattleId(battle.id);
    setBattleForm({
      name: battle.name,
      bannerImageUrl: battle.bannerImageUrl ?? "",
      startDate: toDateInput(battle.startDate),
      endDate: toDateInput(battle.endDate),
      overview: battle.overview ?? "",
      rules: battle.rules ?? "",
      scoreRewards: (battle.scoreRewards ?? []).map((tier) => ({
        score: tier.score,
        normalRewards: normalizeRewards(tier.normalRewards),
        passLiteRewards: normalizeRewards(
          tier.passLiteRewards ?? tier.passRewards,
        ),
        passPremiumRewards: normalizeRewards(tier.passPremiumRewards),
      })),
      rankingRewards: (battle.rankingRewards ?? []).map((ranking) => ({
        rankFrom: ranking.rankFrom,
        rankTo: ranking.rankTo,
        rewards: normalizeRewards(ranking.rewards),
      })),
    });

    setBannerImageFile(null);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateTier(index: number, patch: Partial<ScoreReward>) {
    setBattleForm((current) => ({
      ...current,
      scoreRewards: current.scoreRewards.map((tier, i) =>
        i === index ? { ...tier, ...patch } : tier,
      ),
    }));
  }

  function addTier() {
    setBattleForm((current) => ({
      ...current,
      scoreRewards: [
        ...current.scoreRewards,
        {
          score: "",
          normalRewards: [],
          passLiteRewards: [],
          passPremiumRewards: [],
        },
      ],
    }));
  }

  function updateReward(
    tierIndex: number,
    type: RewardType,
    rewardIndex: number,
    patch: Partial<Reward>,
  ) {
    setBattleForm((current) => ({
      ...current,
      scoreRewards: current.scoreRewards.map((tier, i) =>
        i !== tierIndex
          ? tier
          : {
              ...tier,
              [type]: (tier[type] ?? []).map((reward, j) =>
                j === rewardIndex ? { ...reward, ...patch } : reward,
              ),
            },
      ),
    }));
  }

  function addReward(tierIndex: number, type: RewardType) {
    const firstItem = items.find((item) => item.active);

    if (!firstItem) {
      setError("先に報酬アイテムを登録してください");
      return;
    }

    updateTier(tierIndex, {
      [type]: [
        ...(battleForm.scoreRewards[tierIndex]?.[type] ?? []),
        { itemId: firstItem.id, quantity: 1 },
      ],
    });
  }

  function removeReward(
    tierIndex: number,
    type: RewardType,
    rewardIndex: number,
  ) {
    updateTier(tierIndex, {
      [type]: (battleForm.scoreRewards[tierIndex]?.[type] ?? []).filter(
        (_, i) => i !== rewardIndex,
      ),
    });
  }

  function updateRanking(
    index: number,
    patch: Partial<RankingReward>,
  ) {
    setBattleForm((current) => ({
      ...current,
      rankingRewards: current.rankingRewards.map((ranking, i) =>
        i === index ? { ...ranking, ...patch } : ranking,
      ),
    }));
  }

  function addRanking() {
    setBattleForm((current) => ({
      ...current,
      rankingRewards: [
        ...current.rankingRewards,
        { rankFrom: "", rankTo: "", rewards: [] },
      ],
    }));
  }

  function addRankingReward(rankingIndex: number) {
    const firstItem = items.find((item) => item.active);

    if (!firstItem) {
      setError("先に報酬アイテムを登録してください");
      return;
    }

    const ranking = battleForm.rankingRewards[rankingIndex];
    if (!ranking) return;

    updateRanking(rankingIndex, {
      rewards: [
        ...ranking.rewards,
        { itemId: firstItem.id, quantity: 1 },
      ],
    });
  }

  function updateRankingReward(
    rankingIndex: number,
    rewardIndex: number,
    patch: Partial<Reward>,
  ) {
    const ranking = battleForm.rankingRewards[rankingIndex];
    if (!ranking) return;

    updateRanking(rankingIndex, {
      rewards: ranking.rewards.map((reward, i) =>
        i === rewardIndex ? { ...reward, ...patch } : reward,
      ),
    });
  }

  function removeRankingReward(rankingIndex: number, rewardIndex: number) {
    const ranking = battleForm.rankingRewards[rankingIndex];
    if (!ranking) return;

    updateRanking(rankingIndex, {
      rewards: ranking.rewards.filter((_, i) => i !== rewardIndex),
    });
  }

  const totals = (type: RewardType) => {
    const counts = new Map<string, number>();

    for (const tier of battleForm.scoreRewards) {
      for (const reward of tier[type] ?? []) {
        counts.set(
          reward.itemId,
          (counts.get(reward.itemId) ?? 0) +
            Math.max(0, Number(reward.quantity) || 0),
        );
      }
    }

    return [...counts.entries()].map(([itemId, quantity]) => ({
      item: items.find((candidate) => candidate.id === itemId),
      itemId,
      quantity,
    }));
  };

  const combinedTotals = (types: RewardType[]) => {
    const counts = new Map<string, number>();

    for (const tier of battleForm.scoreRewards) {
      for (const type of types) {
        for (const reward of tier[type] ?? []) {
          counts.set(
            reward.itemId,
            (counts.get(reward.itemId) ?? 0) +
              Math.max(0, Number(reward.quantity) || 0),
          );
        }
      }
    }

    return [...counts.entries()].map(([itemId, quantity]) => ({
      item: items.find((candidate) => candidate.id === itemId),
      itemId,
      quantity,
    }));
  };

  async function saveBattle() {
    setError("");
    setMessage("");

    if (
      !battleForm.name.trim() ||
      !battleForm.startDate ||
      !battleForm.endDate
    ) {
      setError("イベント名と開催期間を入力してください");
      return;
    }

    if (
      new Date(battleForm.endDate).getTime() <
      new Date(battleForm.startDate).getTime()
    ) {
      setError("終了日時は開始日時以降にしてください");
      return;
    }

    for (let i = 0; i < battleForm.scoreRewards.length; i++) {
      const tier = battleForm.scoreRewards[i];

      if (
        tier.score === "" ||
        !Number.isFinite(Number(tier.score)) ||
        Number(tier.score) < 0
      ) {
        setError(
          `${i + 1}番目のスコア段階に、0以上のスコアを入力してください`,
        );
        return;
      }

      const rewardGroups: [string, Reward[]][] = [
        ["通常報酬", tier.normalRewards],
        ["Lite報酬", tier.passLiteRewards],
        ["Premium報酬", tier.passPremiumRewards],
      ];

      for (const [label, rewards] of rewardGroups) {
        for (let j = 0; j < rewards.length; j++) {
          const reward = rewards[j];

          if (
            !reward.itemId ||
            reward.quantity === "" ||
            !Number.isInteger(Number(reward.quantity)) ||
            Number(reward.quantity) < 1
          ) {
            setError(
              `${i + 1}番目のスコア段階の${label}、${j + 1}番目の報酬の個数を1以上の整数で入力してください`,
            );
            return;
          }
        }
      }
    }

    for (let i = 0; i < battleForm.rankingRewards.length; i++) {
      const ranking = battleForm.rankingRewards[i];

      if (
        ranking.rankFrom === "" ||
        ranking.rankTo === "" ||
        !Number.isInteger(Number(ranking.rankFrom)) ||
        !Number.isInteger(Number(ranking.rankTo)) ||
        Number(ranking.rankFrom) < 1 ||
        Number(ranking.rankTo) < Number(ranking.rankFrom)
      ) {
        setError(
          `${i + 1}番目のランキング報酬の順位範囲を正しく入力してください`,
        );
        return;
      }

      for (let j = 0; j < ranking.rewards.length; j++) {
        const reward = ranking.rewards[j];

        if (
          !reward.itemId ||
          reward.quantity === "" ||
          !Number.isInteger(Number(reward.quantity)) ||
          Number(reward.quantity) < 1
        ) {
          setError(
            `${i + 1}番目のランキング報酬の${j + 1}番目の個数を1以上の整数で入力してください`,
          );
          return;
        }
      }
    }

    try {
      const bannerImageUrl = bannerImageFile
        ? await uploadImage(bannerImageFile, "challenge-banner")
        : battleForm.bannerImageUrl;

      const payload = {
        ...battleForm,
        bannerImageUrl,
        startDate: new Date(battleForm.startDate).toISOString(),
        endDate: new Date(battleForm.endDate).toISOString(),
        scoreRewards: [...battleForm.scoreRewards]
          .map((tier) => ({
            score: Number(tier.score),
            normalRewards: tier.normalRewards,
            passLiteRewards: tier.passLiteRewards,
            passPremiumRewards: tier.passPremiumRewards,
          }))
          .sort((a, b) => a.score - b.score),
        rankingRewards: battleForm.rankingRewards.map((ranking) => ({
          rankFrom: Number(ranking.rankFrom),
          rankTo: Number(ranking.rankTo),
          rewards: ranking.rewards,
        })),
      };

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

      if (!response.ok) {
        throw new Error(data?.message ?? "チャレバトの保存に失敗しました");
      }

      setMessage("チャレバトを保存しました");
      setBattleForm(emptyBattle());
      setBannerImageFile(null);
      setEditingBattleId(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "保存に失敗しました",
      );
    }
  }

  const rewardItemOptions = items.filter((item) => item.active);

  function rewardItemSelect(
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 rounded border border-border bg-background px-2 py-2 text-sm"
      >
        {rewardItemOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    );
  }

  function rewardQuantityInput(
    quantity: number | "",
    onChange: (quantity: number | "") => void,
  ) {
    return (
      <label className="text-xs font-bold">
        個数
        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          placeholder="個数"
          onChange={(event) =>
            onChange(
              event.target.value === "" ? "" : Number(event.target.value),
            )
          }
          className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
        />
      </label>
    );
  }

  function renderTotals(
    title: string,
    rows: ReturnType<typeof combinedTotals>,
  ) {
    return (
      <div className="rounded-md bg-secondary/50 p-4">
        <h4 className="mb-2 font-black">{title}</h4>
        {rows.length ? (
          rows.map(({ item, itemId, quantity }) => (
            <div
              key={itemId}
              className="flex items-center justify-between gap-2 py-1 text-sm"
            >
              <span>{item?.name ?? itemId}</span>
              <b>×{quantity}</b>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">まだ報酬がありません</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          登録された全スコア段階の数量を合算しています。
        </p>
      </div>
    );
  }

  return (
    <GuideShell>
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"
      >
        <ArrowLeft size={14} />
        管理画面に戻る
      </Link>

      <PageIntro
        eyebrow="ADMIN / CHALLENGE BATTLE"
        title="チャレバト管理"
        description="報酬アイテム、スコア報酬、ランキング報酬、開催期間を登録・編集します。"
      />

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-black">
          {editingItemId ? "報酬アイテムを編集" : "報酬アイテムを登録"}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-bold">
            アイテム名
            <input
              value={itemForm.name}
              onChange={(event) =>
                setItemForm({ ...itemForm, name: event.target.value })
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="text-sm font-bold">
            画像ファイル
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setImageFile(event.target.files?.[0] ?? null)
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs"
            />
            <input
              value={itemForm.imageUrl}
              onChange={(event) =>
                setItemForm({ ...itemForm, imageUrl: event.target.value })
              }
              placeholder="画像URL（直接入力も可）"
              className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-xs"
            />
          </label>

          <label className="text-sm font-bold md:col-span-2">
            説明
            <textarea
              value={itemForm.description}
              onChange={(event) =>
                setItemForm({ ...itemForm, description: event.target.value })
              }
              className="mt-1 min-h-16 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => void saveItem()}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            <Save size={14} />
            保存
          </button>

          {editingItemId ? (
            <button
              onClick={() => {
                setEditingItemId(null);
                setItemForm(emptyItem());
                setImageFile(null);
              }}
              className="rounded border border-border px-3 py-2 text-xs"
            >
              <X size={14} className="inline" /> キャンセル
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-5 space-y-2">
        <h2 className="text-lg font-black">
          登録済み報酬アイテム（{items.length}件）
        </h2>

        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-3 rounded-md border border-card-border bg-card p-3 ${
              !item.active ? "opacity-50" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-secondary">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <b>{item.name}</b>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
                {!item.active ? (
                  <p className="text-xs text-red-600">無効</p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                onClick={() => editItem(item)}
                aria-label="編集"
                className="text-primary"
              >
                <Pencil size={16} />
              </button>
              {item.active ? (
                <button
                  onClick={() =>
                    void remove(`challenge-reward-items/${item.id}`)
                  }
                  aria-label="無効化"
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-black">
          {editingBattleId ? "チャレバトを編集" : "チャレバトを登録"}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-bold">
            イベント名
            <input
              value={battleForm.name}
              onChange={(event) =>
                setBattleForm({ ...battleForm, name: event.target.value })
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="text-sm font-bold md:col-span-2">
            <label>
              バナー画像
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) =>
                  setBannerImageFile(event.target.files?.[0] ?? null)
                }
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-2"
              />
            </label>

            {bannerImageFile ? (
              <p className="mt-1 text-xs font-normal">
                選択中：{bannerImageFile.name}
              </p>
            ) : null}

            {battleForm.bannerImageUrl ? (
              <img
                src={battleForm.bannerImageUrl}
                alt="チャレバトのバナー"
                className="mt-3 max-h-48 w-full rounded border border-border object-contain"
              />
            ) : null}
          </div>

          <label className="text-sm font-bold">
            開始日時
            <input
              type="datetime-local"
              value={battleForm.startDate}
              onChange={(event) =>
                setBattleForm({
                  ...battleForm,
                  startDate: event.target.value,
                })
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="text-sm font-bold">
            終了日時
            <input
              type="datetime-local"
              value={battleForm.endDate}
              onChange={(event) =>
                setBattleForm({
                  ...battleForm,
                  endDate: event.target.value,
                })
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="text-sm font-bold md:col-span-2">
            概要
            <textarea
              value={battleForm.overview}
              onChange={(event) =>
                setBattleForm({ ...battleForm, overview: event.target.value })
              }
              className="mt-1 min-h-16 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="text-sm font-bold md:col-span-2">
            ルール
            <textarea
              value={battleForm.rules}
              onChange={(event) =>
                setBattleForm({ ...battleForm, rules: event.target.value })
              }
              className="mt-1 min-h-16 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h3 className="text-base font-black">スコア別報酬</h3>
          <button
            onClick={addTier}
            className="inline-flex items-center gap-1 rounded border border-primary px-3 py-2 text-xs font-bold text-primary"
          >
            <Plus size={14} />
            スコア段階を追加
          </button>
        </div>

        {battleForm.scoreRewards.map((tier, tierIndex) => (
          <div
            key={tierIndex}
            className="mt-4 rounded-md border border-border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold">
                必要スコア
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tier.score}
                  placeholder="スコアを入力"
                  onChange={(event) =>
                    updateTier(tierIndex, {
                      score:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                  className="ml-2 w-36 rounded border border-border bg-background px-3 py-2"
                />
              </label>

              <button
                onClick={() =>
                  setBattleForm((current) => ({
                    ...current,
                    scoreRewards: current.scoreRewards.filter(
                      (_, i) => i !== tierIndex,
                    ),
                  }))
                }
                className="text-xs text-red-600"
              >
                <Trash2 size={14} className="inline" /> 段階を削除
              </button>
            </div>

            {rewardTypes.map(({ value: type, label }) => (
              <div key={type} className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-black">{label}</h4>
                  <button
                    onClick={() => addReward(tierIndex, type)}
                    className="inline-flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs font-bold text-primary"
                  >
                    <Plus size={13} />
                    報酬追加
                  </button>
                </div>

                <div className="space-y-2">
                  {(tier[type] ?? []).map((reward, rewardIndex) => (
                    <div
                      key={rewardIndex}
                      className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                    >
                      {rewardItemSelect(reward.itemId, (itemId) =>
                        updateReward(tierIndex, type, rewardIndex, { itemId }),
                      )}

                      {rewardQuantityInput(reward.quantity, (quantity) =>
                        updateReward(tierIndex, type, rewardIndex, {
                          quantity,
                        }),
                      )}

                      <button
                        onClick={() =>
                          removeReward(tierIndex, type, rewardIndex)
                        }
                        aria-label="報酬を削除"
                        className="self-center text-red-600"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}

                  {(tier[type] ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      報酬未登録
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}

        <h3 className="mt-7 text-base font-black">スコア報酬の合計</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          すべてのスコア段階に登録された報酬をアイテムごとに合算します。
        </p>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {renderTotals("通常報酬の合計", totals("normalRewards"))}
          {renderTotals("Lite報酬の合計", totals("passLiteRewards"))}
          {renderTotals("Premium報酬の合計", totals("passPremiumRewards"))}
          {renderTotals(
            "有料パス報酬の合計（Lite＋Premium）",
            combinedTotals(["passLiteRewards", "passPremiumRewards"]),
          )}
          {renderTotals(
            "全報酬の合計",
            combinedTotals([
              "normalRewards",
              "passLiteRewards",
              "passPremiumRewards",
            ]),
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h3 className="text-base font-black">ランキング報酬</h3>
          <button
            onClick={addRanking}
            className="inline-flex items-center gap-1 rounded border border-primary px-3 py-2 text-xs font-bold text-primary"
          >
            <Plus size={14} />
            順位報酬を追加
          </button>
        </div>

        {battleForm.rankingRewards.map((ranking, rankingIndex) => (
          <div
            key={rankingIndex}
            className="mt-4 rounded-md border border-border p-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm font-bold">
                順位（開始）
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ranking.rankFrom}
                  placeholder="例：1"
                  onChange={(event) =>
                    updateRanking(rankingIndex, {
                      rankFrom:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                  className="mt-1 block w-28 rounded border border-border bg-background px-3 py-2"
                />
              </label>

              <span className="pb-2">〜</span>

              <label className="text-sm font-bold">
                順位（終了）
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ranking.rankTo}
                  placeholder="例：100"
                  onChange={(event) =>
                    updateRanking(rankingIndex, {
                      rankTo:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                  className="mt-1 block w-28 rounded border border-border bg-background px-3 py-2"
                />
              </label>

              <button
                onClick={() =>
                  setBattleForm((current) => ({
                    ...current,
                    rankingRewards: current.rankingRewards.filter(
                      (_, i) => i !== rankingIndex,
                    ),
                  }))
                }
                className="mb-2 ml-auto text-xs text-red-600"
              >
                <Trash2 size={14} className="inline" />
                順位報酬を削除
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <h4 className="font-black">報酬アイテム</h4>
              <button
                onClick={() => addRankingReward(rankingIndex)}
                className="inline-flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs font-bold text-primary"
              >
                <Plus size={13} />
                報酬追加
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {ranking.rewards.map((reward, rewardIndex) => (
                <div
                  key={rewardIndex}
                  className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                >
                  {rewardItemSelect(reward.itemId, (itemId) =>
                    updateRankingReward(rankingIndex, rewardIndex, {
                      itemId,
                    }),
                  )}

                  {rewardQuantityInput(reward.quantity, (quantity) =>
                    updateRankingReward(rankingIndex, rewardIndex, {
                      quantity,
                    }),
                  )}

                  <button
                    onClick={() =>
                      removeRankingReward(rankingIndex, rewardIndex)
                    }
                    aria-label="ランキング報酬アイテムを削除"
                    className="self-center text-red-600"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}

              {ranking.rewards.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  報酬未登録
                </p>
              ) : null}
            </div>
          </div>
        ))}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => void saveBattle()}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            <Save size={14} />
            チャレバトを保存
          </button>

          {editingBattleId ? (
            <button
              onClick={() => {
                setEditingBattleId(null);
                setBattleForm(emptyBattle());
                setBannerImageFile(null);
                setError("");
                setMessage("");
              }}
              className="rounded border border-border px-3 py-2 text-xs"
            >
              編集をキャンセル
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-black">
          登録済みチャレバト（{battles.length}件）
        </h2>

        {battles.map((battle) => (
          <div
            key={battle.id}
            className={`rounded-md border border-card-border bg-card p-4 shadow-card ${
              !battle.active ? "opacity-50" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black">{battle.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(battle.startDate).toLocaleString("ja-JP")} ～{" "}
                  {new Date(battle.endDate).toLocaleString("ja-JP")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(battle.scoreRewards ?? []).length}段階のスコア報酬
                  {"・"}
                  {(battle.rankingRewards ?? []).length}件の順位報酬
                  {!battle.active ? "・無効" : ""}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => editBattle(battle)}
                  aria-label="編集"
                  className="text-primary"
                >
                  <Pencil size={16} />
                </button>

                {battle.active ? (
                  <button
                    onClick={() =>
                      void remove(`challenge-battles/${battle.id}`)
                    }
                    aria-label="無効化"
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </section>
    </GuideShell>
  );
}
