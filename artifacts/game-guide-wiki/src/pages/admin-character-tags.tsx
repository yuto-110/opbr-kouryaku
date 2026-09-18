import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Tags, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";
const TOKEN_KEY = "opbr_access_token";

type Tag = { id: string; name: string; description: string; supportEffect: string; supportCategory: string; active: boolean };

export default function AdminCharacterTagsPage() {
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", supportEffect: "", supportCategory: "その他" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { navigate("/auth"); return; }
    setLoading(true);
    try {
      const me = await fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meData = await me.json().catch(() => null);
      if (!me.ok || meData?.user?.role !== "admin") { navigate("/admin"); return; }
      const response = await fetch(`${API_BASE_URL}/admin/character-tags`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("タグ一覧の取得に失敗しました");
      setTags(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : "読み込みに失敗しました"); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function reset() { setEditingId(null); setForm({ name: "", description: "", supportEffect: "", supportCategory: "その他" }); setMessage(""); setError(""); }
  function edit(tag: Tag) { setEditingId(tag.id); setForm({ name: tag.name, description: tag.description ?? "", supportEffect: tag.supportEffect ?? "", supportCategory: tag.supportCategory ?? "その他" }); setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function save() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { navigate("/auth"); return; }
    if (!form.name.trim()) { setError("タグ名を入力してください"); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(editingId ? `${API_BASE_URL}/admin/character-tags/${encodeURIComponent(editingId)}` : `${API_BASE_URL}/admin/character-tags`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "タグの保存に失敗しました");
      setMessage(editingId ? "タグを更新しました" : "タグを追加しました");
      reset();
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "保存に失敗しました"); } finally { setSaving(false); }
  }

  async function remove(tag: Tag) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !window.confirm(`「${tag.name}」を無効化しますか？`)) return;
    const response = await fetch(`${API_BASE_URL}/admin/character-tags/${encodeURIComponent(tag.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { const data = await response.json().catch(() => null); setError(data?.message ?? "削除に失敗しました"); return; }
    if (editingId === tag.id) reset();
    await load();
  }

  return <GuideShell>
    <div className="mb-5"><Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> 管理画面に戻る</Link></div>
    <PageIntro eyebrow="ADMIN / CHARACTER TAGS" title="キャラクタータグ管理" description="キャラクタータグを自由に追加し、サポート編成で参照する効果まで管理します。" />
    {(message || error) && <div className={`mb-5 whitespace-pre-line rounded-md border p-3 text-xs font-bold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}
    <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-black">{editingId ? "タグを編集" : "新しいタグ"}</h2><p className="mt-1 text-[11px] text-muted-foreground">タグ名はキャラクター登録の複数選択欄に自動反映されます。</p></div>{editingId && <button type="button" onClick={reset} className="rounded border border-border p-2 text-muted-foreground"><X size={15} /></button>}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="mb-2 block text-xs font-black">タグ名 *</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="例：麦わらの一味" /></label>
        <label className="block"><span className="mb-2 block text-xs font-black">サポート分類</span><input value={form.supportCategory} onChange={e => setForm({ ...form, supportCategory: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="例：属性 / 役職 / タグ効果" /></label>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs font-black">タグ説明</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="このタグが何を表すか" /></label>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs font-black">サポート時の効果</span><textarea value={form.supportEffect} onChange={e => setForm({ ...form, supportEffect: e.target.value })} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="例：同じタグを持つキャラの○○が増加する、など" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save size={14} /> {saving ? "保存中…" : editingId ? "変更を保存" : "タグを追加"}</button>{editingId && <button type="button" onClick={reset} className="rounded-md border border-border px-4 py-2.5 text-xs font-black">新規入力に戻す</button>}</div>
    </section>
    <section className="mt-6 rounded-md border border-card-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-black">登録済みタグ</h2><span className="text-[10px] text-muted-foreground">{tags.length}件</span></div>
      {loading ? <p className="text-xs text-muted-foreground">読み込み中…</p> : <div className="space-y-3">{tags.map(tag => <div key={tag.id} className="rounded-md border border-border bg-background p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary/10 text-primary"><Tags size={16} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black">{tag.name}</span><span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold">{tag.supportCategory}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{tag.description || "説明なし"}</p>{tag.supportEffect && <p className="mt-2 rounded bg-primary/5 p-2 text-xs leading-5"><b>サポート効果：</b>{tag.supportEffect}</p>}</div><button type="button" onClick={() => edit(tag)} className="rounded border border-border p-2 text-muted-foreground hover:text-primary"><Save size={14} /></button><button type="button" onClick={() => void remove(tag)} className="rounded border border-border p-2 text-muted-foreground hover:text-red-600"><Trash2 size={14} /></button></div></div>)}</div>}
    </section>
  </GuideShell>;
}
