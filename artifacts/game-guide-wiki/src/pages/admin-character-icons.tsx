import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, ImagePlus, Pencil, Save, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";
const ACCESS_TOKEN_KEY = "opbr_access_token";

type IconMaster = {
  id: string;
  name: string;
  imageUrl: string;
  active: boolean;
};

type FormState = {
  name: string;
  imageUrl: string;
};

const emptyForm = (): FormState => ({ name: "", imageUrl: "" });

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function makeFilename(name: string, file: File) {
  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : ".webp";
  const base =
    name.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") ||
    "character-icon";
  return `${base}-${Date.now()}${ext}`;
}

export default function AdminCharacterIconsPage() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<IconMaster[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";

  async function load() {
    if (!token) { navigate("/auth"); return; }
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
      const response = await fetch(`${API_BASE_URL}/admin/character-icons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("キャラクターアイコン一覧の取得に失敗しました");
      setItems((await response.json()) as IconMaster[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setImageFile(null);
    setMessage("");
    setError("");
  }

  function startEdit(item: IconMaster) {
    setEditingId(item.id);
    setForm({ name: item.name, imageUrl: item.imageUrl });
    setImageFile(null);
    setMessage("");
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null);
  }

  async function uploadImage(file: File, name: string) {
    const response = await fetch(`${API_BASE_URL}/uploads/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        folder: "character-icons",
        filename: makeFilename(name, file),
        contentType: file.type,
        contentBase64: await fileToBase64(file),
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message ?? "画像アップロードに失敗しました");
    return String(data.publicUrl ?? "");
  }

  async function save() {
    if (!token) { navigate("/auth"); return; }
    if (!form.name.trim()) { setError("アイコン名を入力してください"); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      let imageUrl = form.imageUrl.trim();
      if (imageFile) imageUrl = await uploadImage(imageFile, form.name);
      if (!imageUrl) throw new Error("画像を選択するか、画像URLを入力してください");
      const response = await fetch(
        editingId
          ? `${API_BASE_URL}/admin/character-icons/${encodeURIComponent(editingId)}`
          : `${API_BASE_URL}/admin/character-icons`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: form.name.trim(), imageUrl }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "アイコンの保存に失敗しました");
      setMessage(editingId ? "アイコンを更新しました" : "アイコンを登録しました");
      setEditingId(null);
      setForm(emptyForm());
      setImageFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: IconMaster) {
    if (!window.confirm(`「${item.name}」を削除しますか？`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/character-icons/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "削除に失敗しました");
      if (editingId === item.id) startCreate();
      setMessage("アイコンを削除しました");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  return (
    <GuideShell>
      <PageIntro
        eyebrow="ADMIN / CHARACTER ICONS"
        title="キャラクターアイコン管理"
        description="キャラクター詳細の左上に重ねる、登録済みの合成アイコン画像を管理します。"
        action={
          <Link href="/admin" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold">
            <ArrowLeft size={14} /> 管理画面
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black">{editingId ? "アイコンを編集" : "アイコンを追加"}</h2>
            {editingId && <button type="button" onClick={startCreate} className="rounded border border-border p-2 text-muted-foreground"><X size={14} /></button>}
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-black">アイコン名</span>
            <input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="例：赤属性アタッカー" />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-black">画像</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleFileChange} className="w-full text-xs" />
            {imageFile && <p className="mt-2 text-[10px] text-muted-foreground">選択中: {imageFile.name}</p>}
          </label>
          <div className="mt-4">
            <label className="block text-xs font-black">既存画像URL</label>
            <input value={form.imageUrl} onChange={(e) => setForm((v) => ({ ...v, imageUrl: e.target.value }))} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="https://..." />
          </div>
          {form.imageUrl && <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-background p-3"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary"><img src={form.imageUrl} alt="" className="h-full w-full object-contain" /></div><p className="text-[10px] leading-5 text-muted-foreground">透明部分を含む1枚の合成画像をそのまま保存してください。</p></div>}
          <button type="button" disabled={saving} onClick={() => void save()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-xs font-black text-white disabled:opacity-50">
            {editingId ? <Save size={15} /> : <ImagePlus size={15} />}
            {saving ? "保存中…" : editingId ? "更新する" : "登録する"}
          </button>
          {message && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{message}</p>}
          {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
        </section>

        <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-black">登録済みアイコン</h2><span className="text-[10px] font-bold text-muted-foreground">{items.length}件</span></div>
          {loading ? <p className="text-xs text-muted-foreground">読み込み中…</p> : items.length === 0 ? <div className="rounded-md border border-dashed border-border p-8 text-center"><p className="text-xs font-bold text-muted-foreground">まだアイコンが登録されていません。</p></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-md border border-border bg-background p-3"><div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-secondary"><img src={item.imageUrl} alt="" className="h-full w-full object-contain" /></div><p className="mt-3 truncate text-xs font-black">{item.name}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => startEdit(item)} className="flex flex-1 items-center justify-center gap-1 rounded border border-border px-2 py-2 text-[10px] font-bold hover:border-primary"><Pencil size={12} /> 編集</button><button type="button" onClick={() => void remove(item)} className="flex flex-1 items-center justify-center gap-1 rounded border border-red-200 px-2 py-2 text-[10px] font-bold text-red-600"><Trash2 size={12} /> 削除</button></div></div>)}</div>}
        </section>
      </div>
    </GuideShell>
  );
}
