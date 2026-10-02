import { useEffect, useState } from "react";
import { ArrowLeft, Save, Tags, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const TOKEN_KEY = "opbr_access_token";

type MedalTag = {
  id: string;
  name: string;
  twoSetEffect: string;
  threeSetEffect: string;
  active: boolean;
};

type MedalTagForm = {
  name: string;
  twoSetEffect: string;
  threeSetEffect: string;
};

function createEmptyForm(): MedalTagForm {
  return { name: "", twoSetEffect: "", threeSetEffect: "" };
}

export default function AdminMedalTagsPage() {
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedalTagForm>(createEmptyForm());
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
      const response = await fetch(`${API_BASE_URL}/admin/medal-tags`, {
        headers: { Authorization: `****** },
      });
      if (!response.ok) throw new Error("メダルタグ一覧の取得に失敗しました");
      setTags((await response.json()) as MedalTag[]);
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
      setError("タグ名を入力してください");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId
          ? `${API_BASE_URL}/admin/medal-tags/${encodeURIComponent(editingId)}`
          : `${API_BASE_URL}/admin/medal-tags`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `******
          },
          body: JSON.stringify({
            name: form.name.trim(),
            twoSetEffect: form.twoSetEffect.trim(),
            threeSetEffect: form.threeSetEffect.trim(),
          }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "メダルタグの保存に失敗しました");
      setMessage(editingId ? "メダルタグを更新しました" : "メダルタグを追加しました");
      setEditingId(null);
      setForm(createEmptyForm());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function remove(tag: MedalTag) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !window.confirm(`「${tag.name}」を無効化しますか？`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/medal-tags/${encodeURIComponent(tag.id)}`, {
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

  return (
    <GuideShell>
      <PageIntro
        eyebrow="ADMIN / MEDAL TAGS"
        title="メダルタグ管理"
        description="メダル専用タグと2セット/3セット効果を管理します。"
        action={<Link href="/admin" className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-bold"><ArrowLeft size={14} /> 管理画面へ</Link>}
      />

      <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black"><Tags size={16} /> {editingId ? "メダルタグ編集" : "メダルタグ追加"}</h2>
        <div className="grid gap-4">
          <label className="block text-xs font-bold">タグ名
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block text-xs font-bold">2セット効果
            <textarea value={form.twoSetEffect} onChange={(event) => setForm((current) => ({ ...current, twoSetEffect: event.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block text-xs font-bold">3セット効果
            <textarea value={form.threeSetEffect} onChange={(event) => setForm((current) => ({ ...current, threeSetEffect: event.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60"><Save size={14} /> {saving ? "保存中..." : editingId ? "更新する" : "追加する"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(createEmptyForm()); }} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-xs font-bold"><X size={14} /> キャンセル</button>}
          </div>
          {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}
          {error && <p className="text-xs font-bold text-destructive">{error}</p>}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-sm font-black">登録済みメダルタグ</h2>
        {loading ? (
          <p className="text-xs text-muted-foreground">読み込み中…</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black">{tag.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">2セット: {tag.twoSetEffect || "未登録"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">3セット: {tag.threeSetEffect || "未登録"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => { setEditingId(tag.id); setForm({ name: tag.name, twoSetEffect: tag.twoSetEffect, threeSetEffect: tag.threeSetEffect }); }} className="rounded-md border border-border px-3 py-1 text-xs font-bold">編集</button>
                    <button type="button" onClick={() => void remove(tag)} className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-bold text-destructive"><Trash2 size={12} className="inline" /> 削除</button>
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
