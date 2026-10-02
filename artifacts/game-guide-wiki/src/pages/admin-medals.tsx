import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const TOKEN_KEY = "opbr_access_token";

type MedalTag = {
  id: string;
  name: string;
};

type AdditionalLottery = {
  star: 1 | 2 | 3;
  effect: string;
  probability: string;
};

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
  additionalLotteries: AdditionalLottery[];
  active: boolean;
};

type MedalForm = Omit<Medal, "id" | "active">;

function createLottery(): AdditionalLottery {
  return { star: 3, effect: "", probability: "" };
}

function createEmptyForm(): MedalForm {
  return {
    name: "",
    imageUrl: "",
    uniqueTrait: "",
    additionalTrait1: "",
    additionalTrait2: "",
    additionalTrait3: "",
    medalTagIds: [],
    tagEffect: "",
    additionalLotteries: [createLottery()],
  };
}

export default function AdminMedalsPage() {
  const [, navigate] = useLocation();
  const [medals, setMedals] = useState<Medal[]>([]);
  const [medalTags, setMedalTags] = useState<MedalTag[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedalForm>(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [medalsResponse, tagsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/medals`, {
          headers: { Authorization: `****** },
        }),
        fetch(`${API_BASE_URL}/admin/medal-tags`, {
          headers: { Authorization: `****** },
        }),
      ]);

      if (!medalsResponse.ok) throw new Error("メダル一覧の取得に失敗しました");
      if (!tagsResponse.ok) throw new Error("メダルタグ一覧の取得に失敗しました");

      setMedals((await medalsResponse.json()) as Medal[]);
      setMedalTags((await tagsResponse.json()) as MedalTag[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate("/auth");
      return;
    }
    if (!form.name.trim()) {
      setError("メダル名を入力してください");
      return;
    }

    const normalizedLotteries = form.additionalLotteries
      .map((item) => ({
        star: item.star,
        effect: item.effect.trim(),
        probability: item.probability.trim(),
      }))
      .filter((item) => item.effect && item.probability);

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId
          ? `${API_BASE_URL}/admin/medals/${encodeURIComponent(editingId)}`
          : `${API_BASE_URL}/admin/medals`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `******
          },
          body: JSON.stringify({
            name: form.name.trim(),
            imageUrl: form.imageUrl?.trim() || "",
            uniqueTrait: form.uniqueTrait.trim(),
            additionalTrait1: form.additionalTrait1.trim(),
            additionalTrait2: form.additionalTrait2.trim(),
            additionalTrait3: form.additionalTrait3.trim(),
            medalTagIds: form.medalTagIds,
            tagEffect: form.tagEffect.trim(),
            additionalLotteries: normalizedLotteries,
          }),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message ??
            (editingId ? "メダルの更新に失敗しました" : "メダルの保存に失敗しました"),
        );
      }

      setMessage(editingId ? "メダルを更新しました" : "メダルを追加しました");
      setEditingId(null);
      setForm(createEmptyForm());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function remove(medal: Medal) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !window.confirm(`「${medal.name}」を削除しますか？`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/medals/${encodeURIComponent(medal.id)}`, {
        method: "DELETE",
        headers: { Authorization: `****** },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "削除に失敗しました");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  function setLottery(index: number, patch: Partial<AdditionalLottery>) {
    setForm((current) => ({
      ...current,
      additionalLotteries: current.additionalLotteries.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  return (
    <GuideShell>
      <PageIntro
        eyebrow="ADMIN / MEDALS"
        title="メダル管理"
        description="メダルの基本情報・特性・メダルタグ・抽選割合を管理します。"
        action={<Link href="/admin" className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-bold"><ArrowLeft size={14} /> 管理画面へ</Link>}
      />

      <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-sm font-black">{editingId ? "メダル編集" : "メダル追加"}</h2>
        <div className="grid gap-4">
          <label className="block text-xs font-bold">メダル名
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>

          <label className="block text-xs font-bold">画像URL
            <input value={form.imageUrl ?? ""} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>

          <label className="block text-xs font-bold">固有特性
            <textarea value={form.uniqueTrait} onChange={(event) => setForm((current) => ({ ...current, uniqueTrait: event.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-bold">追加特性1
              <input value={form.additionalTrait1} onChange={(event) => setForm((current) => ({ ...current, additionalTrait1: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-xs font-bold">追加特性2
              <input value={form.additionalTrait2} onChange={(event) => setForm((current) => ({ ...current, additionalTrait2: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-xs font-bold">追加特性3
              <input value={form.additionalTrait3} onChange={(event) => setForm((current) => ({ ...current, additionalTrait3: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
          </div>

          <label className="block text-xs font-bold">メダルタグ（複数選択可）
            <select
              multiple
              value={form.medalTagIds}
              onChange={(event) => setForm((current) => ({
                ...current,
                medalTagIds: Array.from(event.target.selectedOptions).map((option) => option.value),
              }))}
              className="mt-1 h-40 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {medalTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold">タグ効果
            <textarea value={form.tagEffect} onChange={(event) => setForm((current) => ({ ...current, tagEffect: event.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>

          <div>
            <div className="mb-2 text-xs font-bold">抽選割合</div>
            <div className="space-y-2">
              {form.additionalLotteries.map((lottery, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-[88px_minmax(0,1fr)_120px_auto]">
                  <select
                    value={lottery.star}
                    onChange={(event) => setLottery(index, { star: Number(event.target.value) as 1 | 2 | 3 })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value={1}>★1</option>
                    <option value={2}>★2</option>
                    <option value={3}>★3</option>
                  </select>
                  <input value={lottery.effect} onChange={(event) => setLottery(index, { effect: event.target.value })} placeholder="効果内容" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <input value={lottery.probability} onChange={(event) => setLottery(index, { probability: event.target.value })} placeholder="確率（例: 10.77%）" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <button type="button" onClick={() => setForm((current) => ({ ...current, additionalLotteries: current.additionalLotteries.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-md border border-destructive/30 px-2 py-1 text-xs font-bold text-destructive"><Trash2 size={12} className="inline" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm((current) => ({ ...current, additionalLotteries: [...current.additionalLotteries, createLottery()] }))} className="mt-2 inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-bold"><Plus size={12} /> 抽選項目を追加</button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60"><Save size={14} /> {saving ? "保存中..." : editingId ? "更新する" : "追加する"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(createEmptyForm()); }} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-xs font-bold"><X size={14} /> キャンセル</button>}
          </div>

          {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}
          {error && <p className="text-xs font-bold text-destructive">{error}</p>}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-sm font-black">登録済みメダル</h2>
        {loading ? (
          <p className="text-xs text-muted-foreground">読み込み中…</p>
        ) : (
          <div className="space-y-2">
            {medals.map((medal) => (
              <div key={medal.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{medal.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{medal.uniqueTrait || "固有特性未登録"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => { setEditingId(medal.id); setForm({ name: medal.name, imageUrl: medal.imageUrl ?? "", uniqueTrait: medal.uniqueTrait, additionalTrait1: medal.additionalTrait1, additionalTrait2: medal.additionalTrait2, additionalTrait3: medal.additionalTrait3, medalTagIds: medal.medalTagIds ?? [], tagEffect: medal.tagEffect, additionalLotteries: (medal.additionalLotteries ?? []).length ? medal.additionalLotteries : [createLottery()] }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-md border border-border px-3 py-1 text-xs font-bold">編集</button>
                    <button type="button" onClick={() => void remove(medal)} className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-bold text-destructive"><Trash2 size={12} className="inline" /> 削除</button>
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
