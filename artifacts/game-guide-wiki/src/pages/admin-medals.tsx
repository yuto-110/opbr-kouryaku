import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import { emptyAdditionalTraits, type Medal, type MedalAdditionalTrait, type MedalTag } from "@/data/medal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";
const TOKEN_KEY = "opbr_access_token";
type FormState = Omit<Medal, "id" | "active">;
const emptyForm = (): FormState => ({ name: "", imageUrl: "", uniqueTrait: "", medalTags: [], additionalTraits: emptyAdditionalTraits() });

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

export default function AdminMedalsPage() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Medal[]>([]);
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [tagForm, setTagForm] = useState({ name: "", effect: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem(TOKEN_KEY) ?? "";
  const headers = { Authorization: `Bearer ${token}` };

  async function load() {
    if (!token) { navigate("/auth"); return; }
    const me = await fetch(`${API_BASE_URL}/users/me`, { headers });
    const meData = await me.json().catch(() => null);
    if (!me.ok || meData?.user?.role !== "admin") { navigate("/admin"); return; }
    const [medalsResponse, tagsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/medals`, { headers }),
      fetch(`${API_BASE_URL}/admin/medal-tags`, { headers }),
    ]);
    if (!medalsResponse.ok || !tagsResponse.ok) throw new Error("メダルデータの取得に失敗しました");
    setItems((await medalsResponse.json()) as Medal[]);
    setTags((await tagsResponse.json()) as MedalTag[]);
  }

  useEffect(() => { void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "読み込みに失敗しました")); }, []);

  function edit(item: Medal) {
    setEditingId(item.id);
    setForm({ name: item.name, imageUrl: item.imageUrl, uniqueTrait: item.uniqueTrait, medalTags: item.medalTags, additionalTraits: item.additionalTraits.map((candidates) => Array.isArray(candidates) ? candidates : []).length === 3 ? item.additionalTraits.map((candidates) => Array.isArray(candidates) ? candidates : []) as FormState["additionalTraits"] : emptyAdditionalTraits() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateCandidate(traitIndex: number, candidateIndex: number, field: keyof MedalAdditionalTrait, value: string) {
    setForm((current) => ({
      ...current,
      additionalTraits: current.additionalTraits.map((candidates, index) =>
        index === traitIndex
          ? candidates.map((candidate, index) => index === candidateIndex
            ? { ...candidate, [field]: field === "stars" ? Number(value) as 1 | 2 | 3 : field === "drawRate" ? Number(value) : value }
            : candidate)
          : candidates,
      ) as FormState["additionalTraits"],
    }));
  }

  function addCandidate(index: number) {
    setForm((current) => ({
      ...current,
      additionalTraits: current.additionalTraits.map((candidates, traitIndex) =>
        traitIndex === index ? [...candidates, { stars: 1, content: "", drawRate: 0 }] : candidates,
      ) as FormState["additionalTraits"],
    }));
  }

  function removeCandidate(traitIndex: number, candidateIndex: number) {
    setForm((current) => ({
      ...current,
      additionalTraits: current.additionalTraits.map((candidates, index) =>
        index === traitIndex ? candidates.filter((_, index) => index !== candidateIndex) : candidates,
      ) as FormState["additionalTraits"],
    }));
  }

  async function upload(file: File) {
    const response = await fetch(`${API_BASE_URL}/uploads/github`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ folder: "medals", filename: `medal-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, contentType: file.type, contentBase64: await fileToBase64(file) }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message ?? "画像アップロードに失敗しました");
    return String(data.publicUrl ?? "");
  }

  async function save() {
    if (!form.name.trim()) { setError("メダル名を入力してください"); return; }
    setError(""); setMessage("");
    try {
      const imageUrl = imageFile ? await upload(imageFile) : form.imageUrl;
      const response = await fetch(editingId ? `${API_BASE_URL}/admin/medals/${editingId}` : `${API_BASE_URL}/admin/medals`, { method: editingId ? "PUT" : "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ ...form, imageUrl }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "メダルの保存に失敗しました");
      setMessage(editingId ? "メダルを更新しました" : "メダルを登録しました");
      setEditingId(null); setForm(emptyForm()); setImageFile(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "保存に失敗しました"); }
  }

  async function saveTag() {
    if (!tagForm.name.trim()) { setError("メダルタグ名を入力してください"); return; }
    const response = await fetch(editingTagId ? `${API_BASE_URL}/admin/medal-tags/${editingTagId}` : `${API_BASE_URL}/admin/medal-tags`, { method: editingTagId ? "PUT" : "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(tagForm) });
    if (!response.ok) { setError("メダルタグの保存に失敗しました"); return; }
    setTagForm({ name: "", effect: "" }); setEditingTagId(null); await load();
  }

  async function remove(path: string) {
    if (!window.confirm("削除しますか？")) return;
    const response = await fetch(`${API_BASE_URL}/admin/${path}`, { method: "DELETE", headers });
    if (!response.ok) { setError("削除に失敗しました"); return; }
    await load();
  }

  return (
    <GuideShell>
      <Link href="/admin" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><ArrowLeft size={14} /> 管理画面に戻る</Link>
      <PageIntro eyebrow="ADMIN / MEDALS" title="メダル管理" description="メダル本体と、キャラクタータグとは独立したメダルタグを管理します。" />
      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}
      <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-lg font-black">{editingId ? "メダルを編集" : "メダルを登録"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold">メダル名<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" /></label>
          <label className="text-sm font-bold">メダル画像<input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs" /><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="画像URL（直接入力も可）" className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-xs" /></label>
          <label className="text-sm font-bold md:col-span-2">固有特性<textarea value={form.uniqueTrait} onChange={(e) => setForm({ ...form, uniqueTrait: e.target.value })} className="mt-1 min-h-20 w-full rounded border border-border bg-background px-3 py-2" /></label>
          <div className="md:col-span-2"><span className="text-sm font-bold">メダルタグ</span><select value="" onChange={(event) => { const value = event.target.value; if (value && !form.medalTags.includes(value)) setForm({ ...form, medalTags: [...form.medalTags, value] }); }} className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-sm"><option value="">タグを選択</option>{tags.filter((tag) => !form.medalTags.includes(tag.id)).map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><div className="mt-2 flex flex-wrap gap-2">{form.medalTags.map((tagId) => { const tag = tags.find((item) => item.id === tagId); return <span key={tagId} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{tag?.name ?? tagId}<button type="button" onClick={() => setForm({ ...form, medalTags: form.medalTags.filter((id) => id !== tagId) })}><X size={12} /></button></span>; })}</div></div>
          <div className="md:col-span-2"><h3 className="mb-2 text-sm font-black">追加特性（候補を自由に追加）</h3><div className="grid gap-3 md:grid-cols-3">{form.additionalTraits.map((candidates, index) => <div key={index} className="rounded border border-border p-3"><div className="mb-2 text-xs font-black">追加特性{index + 1}</div>{candidates.map((candidate, candidateIndex) => <div key={candidateIndex} className="mb-2 rounded border border-border bg-background p-2"><div className="mb-2 flex items-center justify-between text-xs font-bold"><span>候補 {candidateIndex + 1}</span><button type="button" onClick={() => removeCandidate(index, candidateIndex)} className="text-red-600"><Trash2 size={13} /></button></div><select value={candidate.stars} onChange={(e) => updateCandidate(index, candidateIndex, "stars", e.target.value)} className="mb-2 w-full rounded border border-border px-2 py-1 text-xs"><option value={1}>★</option><option value={2}>★★</option><option value={3}>★★★</option></select><textarea value={candidate.content} onChange={(e) => updateCandidate(index, candidateIndex, "content", e.target.value)} placeholder="特性内容" className="mb-2 min-h-14 w-full rounded border border-border px-2 py-1 text-xs" /><input type="number" min="0" step="0.01" value={candidate.drawRate} onChange={(e) => updateCandidate(index, candidateIndex, "drawRate", e.target.value)} placeholder="抽選確率（%）" className="w-full rounded border border-border px-2 py-1 text-xs" /></div>)}<button type="button" onClick={() => addCandidate(index)} className="mt-1 inline-flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs font-bold text-primary"><Plus size={13} />抽選候補を追加</button></div>)}</div></div>
        </div>
        <button onClick={() => void save()} className="mt-5 inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white"><Save size={14} />保存</button>
      </section>
      <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card"><h2 className="mb-4 text-lg font-black">メダルタグマスター</h2><div className="flex flex-wrap gap-2"><input value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} placeholder="タグ名" className="rounded border border-border bg-background px-3 py-2 text-sm" /><input value={tagForm.effect} onChange={(e) => setTagForm({ ...tagForm, effect: e.target.value })} placeholder="タグの効果（任意）" className="rounded border border-border bg-background px-3 py-2 text-sm" /><button onClick={() => void saveTag()} className="rounded bg-primary px-3 py-2 text-xs font-bold text-white">タグ保存</button></div><div className="mt-4 space-y-2">{tags.map((tag) => <div key={tag.id} className="flex items-center justify-between rounded border border-border p-3 text-sm"><span><b>{tag.name}</b><span className="ml-2 text-xs text-muted-foreground">{tag.effect}</span></span><span className="flex gap-2"><button onClick={() => { setEditingTagId(tag.id); setTagForm({ name: tag.name, effect: tag.effect }); }}><Pencil size={14} /></button><button onClick={() => void remove(`medal-tags/${tag.id}`)}><Trash2 size={14} /></button></span></div>)}</div></section>
      <section className="mt-6 space-y-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border border-card-border bg-card p-4 shadow-card"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded bg-secondary">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : null}</div><div><b>{item.name}</b><p className="text-xs text-muted-foreground">{item.medalTags.join(" / ")}</p></div></div><span className="flex gap-3"><button onClick={() => edit(item)} className="text-primary"><Pencil size={16} /></button><button onClick={() => void remove(`medals/${item.id}`)} className="text-red-600"><Trash2 size={16} /></button></span></div>)}</section>
    </GuideShell>
  );
}
