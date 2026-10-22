import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import type { MedalTag } from "@/data/medal";

// メダルタグ管理：以前は「メダル管理」ページの一部だった機能を、同じAPI・同じ保存処理のまま独立させたページ
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";
const TOKEN_KEY = "opbr_access_token";

const emptyTagForm = () => ({ name: "", twoSetEffect: "", threeSetEffect: "" });

export default function AdminMedalTagsPage() {
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<MedalTag[]>([]);
  const [tagForm, setTagForm] = useState(emptyTagForm());
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem(TOKEN_KEY) ?? "";
  const headers = { Authorization: `Bearer ${token}` };

  async function load() {
    if (!token) { navigate("/auth"); return; }
    const me = await fetch(`${API_BASE_URL}/users/me`, { headers });
    const meData = await me.json().catch(() => null);
    if (!me.ok || meData?.user?.role !== "admin") { navigate("/admin"); return; }
    const response = await fetch(`${API_BASE_URL}/admin/medal-tags`, { headers });
    if (!response.ok) throw new Error("メダルタグの取得に失敗しました");
    setTags((await response.json()) as MedalTag[]);
  }

  useEffect(() => {
    void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "読み込みに失敗しました"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveTag() {
    if (!tagForm.name.trim()) { setError("メダルタグ名を入力してください"); return; }
    setError(""); setMessage(""); setSaving(true);
    try {
      const response = await fetch(
        editingTagId ? `${API_BASE_URL}/admin/medal-tags/${editingTagId}` : `${API_BASE_URL}/admin/medal-tags`,
        { method: editingTagId ? "PUT" : "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(tagForm) },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "メダルタグの保存に失敗しました");
      setMessage(editingTagId ? "メダルタグを更新しました" : "メダルタグを登録しました");
      setTagForm(emptyTagForm()); setEditingTagId(null);
      await load();
    } catch (reason) {
      // 失敗してもフォームの入力内容は残す
      setError(reason instanceof Error ? reason.message : "メダルタグの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function removeTag(tag: MedalTag) {
    if (!window.confirm(`「${tag.name}」を削除しますか？`)) return;
    setError(""); setMessage("");
    const response = await fetch(`${API_BASE_URL}/admin/medal-tags/${tag.id}`, { method: "DELETE", headers });
    if (!response.ok) { setError("削除に失敗しました"); return; }
    if (editingTagId === tag.id) { setEditingTagId(null); setTagForm(emptyTagForm()); }
    setMessage("メダルタグを削除しました");
    await load();
  }

  return (
    <GuideShell>
      <Link href="/admin" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><ArrowLeft size={14} /> 管理画面に戻る</Link>
      <PageIntro
        eyebrow="ADMIN / MEDAL TAGS"
        title="メダルタグ管理"
        description="メダルに付けるタグ（2セット・3セット効果）を管理します。キャラクタータグとは別のデータです。"
        action={<Link href="/admin/medals" className="rounded-md border border-border px-3 py-2 text-xs font-bold" data-testid="link-admin-medals">メダル管理へ</Link>}
      />
      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}

      <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-lg font-black">{editingTagId ? "メダルタグを編集" : "メダルタグを登録"}</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <input value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} placeholder="タグ名" className="rounded border border-border bg-background px-3 py-2 text-sm" data-testid="input-medal-tag-name" />
          <textarea value={tagForm.twoSetEffect} onChange={(e) => setTagForm({ ...tagForm, twoSetEffect: e.target.value })} placeholder="2セット効果" className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={tagForm.threeSetEffect} onChange={(e) => setTagForm({ ...tagForm, threeSetEffect: e.target.value })} placeholder="3セット効果" className="rounded border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void saveTag()} disabled={saving} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60" data-testid="button-save-medal-tag">
            <Save size={14} />{saving ? "保存中…" : "タグ保存"}
          </button>
          {editingTagId ? (
            <button onClick={() => { setEditingTagId(null); setTagForm(emptyTagForm()); }} className="inline-flex items-center gap-1 rounded border border-border px-4 py-2 text-xs">
              <X size={14} />編集をやめる
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-lg font-black">登録済みメダルタグ（{tags.length}件）</h2>
        {tags.length === 0 ? <p className="text-sm text-muted-foreground">メダルタグはまだありません。</p> : null}
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-start justify-between gap-3 rounded border border-border p-3 text-sm">
              <span className="min-w-0 break-words">
                <b>{tag.name}</b>
                {tag.twoSetEffect ? <span className="mt-1 block text-xs text-muted-foreground">2セット：{tag.twoSetEffect}</span> : null}
                {tag.threeSetEffect ? <span className="block text-xs text-muted-foreground">3セット：{tag.threeSetEffect}</span> : null}
              </span>
              <span className="flex shrink-0 gap-3">
                <button aria-label="編集" onClick={() => { setEditingTagId(tag.id); setTagForm({ name: tag.name, twoSetEffect: tag.twoSetEffect, threeSetEffect: tag.threeSetEffect }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={14} /></button>
                <button aria-label="削除" onClick={() => void removeTag(tag)}><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </GuideShell>
  );
}
