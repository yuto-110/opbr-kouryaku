import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowLeft, Pencil, Plus, Power, Save, Search, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import { RewardIcon } from "@/components/reward-icon";
import { ApiError, apiRequest, uploadImageFile } from "@/lib/admin-api";
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  type RewardItemCategory,
  type RewardItemOption,
} from "@/lib/reward-items";

type ItemForm = {
  name: string;
  category: "normal" | "medal-inheritance";
  description: string;
  imageUrl: string;
  active: boolean;
};

const emptyForm = (): ItemForm => ({
  name: "",
  category: "normal",
  description: "",
  imageUrl: "",
  active: true,
});

export default function AdminItemsPage() {
  const [items, setItems] = useState<RewardItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | RewardItemCategory>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await apiRequest<{ items: RewardItemOption[] }>("/admin/reward-items", { admin: true });
    setItems(data.items);
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "アイテム一覧を取得できませんでした");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: items.length };
    for (const category of REWARD_CATEGORIES) {
      result[category] = items.filter((item) => item.category === category).length;
    }
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (activeFilter === "active" && !item.active) return false;
      if (activeFilter === "inactive" && item.active) return false;
      return !q || item.name.toLowerCase().includes(q);
    });
  }, [items, query, categoryFilter, activeFilter]);

  function startEdit(item: RewardItemOption) {
    if (item.source === "medal") return;
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category === "medal-inheritance" ? "medal-inheritance" : "normal",
      description: item.description,
      imageUrl: item.imageUrl,
      active: item.active,
    });
    setImageFile(null);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setImageFile(null);
  }

  async function save() {
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("アイテム名を入力してください");
      return;
    }

    setSaving(true);
    try {
      const imageUrl = imageFile ? await uploadImageFile(imageFile, "item") : form.imageUrl;
      await apiRequest(editingId ? `/admin/reward-items/${editingId}` : "/admin/reward-items", {
        method: editingId ? "PUT" : "POST",
        admin: true,
        body: { ...form, imageUrl },
      });
      resetForm();
      setMessage("アイテムを保存しました");
      await load();
    } catch (reason) {
      // フォームは初期化しない（入力内容を残して再試行できるようにする）
      setError(reason instanceof Error ? reason.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: RewardItemOption) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/reward-items/${item.id}/active`, {
        method: "PATCH",
        admin: true,
        body: { active: !item.active },
      });
      setMessage(item.active ? "無効化しました（既存の報酬の表示には影響しません）" : "有効化しました");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "切り替えに失敗しました");
    }
  }

  async function remove(item: RewardItemOption) {
    if (!window.confirm(`「${item.name}」を削除しますか？（使用中の場合は削除できません）`)) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/reward-items/${item.id}`, { method: "DELETE", admin: true });
      setMessage("削除しました");
      if (editingId === item.id) resetForm();
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "削除に失敗しました");
    }
  }

  return (
    <GuideShell>
      <PageIntro
        eyebrow="ADMIN / ITEMS"
        title="共通アイテム管理"
        description="チャレバト・イベントミッションなどの報酬で共通利用するアイテムを管理します。メダルはメダル管理画面の登録内容をそのまま利用します。"
        action={
          <Link href="/admin" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold">
            <ArrowLeft size={14} />
            管理画面へ
          </Link>
        }
      />

      {message ? <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-black">{editingId ? "アイテムを編集" : "アイテムを登録"}</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-bold">
            アイテム名
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
              data-testid="input-item-name"
            />
          </label>

          <label className="block text-xs font-bold">
            カテゴリ
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value as ItemForm["category"] })}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
              data-testid="select-item-category"
            >
              <option value="normal">{REWARD_CATEGORY_LABELS.normal}</option>
              <option value="medal-inheritance">{REWARD_CATEGORY_LABELS["medal-inheritance"]}</option>
            </select>
            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
              メダル本体は「メダル管理」で登録すると、自動でここに表示されます。
            </span>
          </label>

          <label className="block text-xs font-bold md:col-span-2">
            説明
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="md:col-span-2">
            <p className="mb-1 text-xs font-bold">画像</p>
            <div className="flex flex-wrap items-center gap-3">
              <RewardIcon imageUrl={form.imageUrl} name={form.name} size={56} />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setImageFile(event.target.files?.[0] ?? null)}
                className="text-xs"
              />
            </div>
            <input
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="または画像URL（https://…）"
              className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-xs"
            />
            {imageFile ? <p className="mt-1 text-[11px] text-muted-foreground">保存時に「{imageFile.name}」をアップロードします</p> : null}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            有効（新しい報酬に選択できる）
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            data-testid="button-save-item"
          >
            {editingId ? <Save size={14} /> : <Plus size={14} />}
            {saving ? "保存中…" : editingId ? "変更を保存" : "アイテムを登録"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded border border-border px-4 py-2 text-xs">
              <X size={14} />
              編集をやめる
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-black">アイテム一覧</h2>

        <div className="mb-3 flex flex-wrap gap-2">
          {(["all", ...REWARD_CATEGORIES] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategoryFilter(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                categoryFilter === value ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {value === "all" ? "すべて" : REWARD_CATEGORY_LABELS[value]}（{counts[value] ?? 0}）
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded border border-border bg-card px-3">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="アイテム名で検索"
              className="w-full bg-transparent py-2 text-sm outline-none"
              data-testid="input-item-search"
            />
          </label>
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}
            className="rounded border border-border bg-card px-3 py-2 text-xs"
          >
            <option value="all">有効・無効すべて</option>
            <option value="active">有効のみ</option>
            <option value="inactive">無効のみ</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">読み込み中…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-md border border-card-border bg-card p-4 text-sm text-muted-foreground">該当するアイテムがありません。</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-md border border-card-border bg-card p-3 shadow-card ${item.active ? "" : "opacity-70"}`}
              >
                <RewardIcon imageUrl={item.imageUrl} name={item.name} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {REWARD_CATEGORY_LABELS[item.category]}
                    {item.active ? "" : " ・ 無効"}
                  </p>
                  {item.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p> : null}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.source === "medal" ? (
                      <Link href="/admin/medals" className="rounded border border-border px-2.5 py-1 text-[11px] font-bold">
                        メダル管理で編集
                      </Link>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(item)} className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[11px] font-bold">
                          <Pencil size={12} />編集
                        </button>
                        <button type="button" onClick={() => void toggleActive(item)} className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[11px] font-bold">
                          <Power size={12} />{item.active ? "無効にする" : "有効にする"}
                        </button>
                        <button type="button" onClick={() => void remove(item)} className="inline-flex items-center gap-1 rounded border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600">
                          <Trash2 size={12} />削除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </GuideShell>
  );
}
