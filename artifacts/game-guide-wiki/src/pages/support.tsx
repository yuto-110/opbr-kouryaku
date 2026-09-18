import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, RotateCcw, Sparkles, WandSparkles } from "lucide-react";
import { Link } from "wouter";
import { GuideShell, PageIntro, SidebarCard } from "@/components/guide-shell";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api";
const goals = ["高難度攻略", "周回速度", "対人戦", "安定耐久"];

type Character = { id: string; name: string; role: { base: string }; tier: string; imageUrl?: string; tags?: string[] };
type Tag = { id: string; name: string; description?: string; supportEffect?: string; supportCategory?: string };

export default function SupportPage() {
  const [goal, setGoal] = useState(goals[0]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Character[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [charactersResponse, tagsResponse] = await Promise.all([fetch(`${API_BASE_URL}/characters`), fetch(`${API_BASE_URL}/character-tags`)]);
        const chars = charactersResponse.ok ? await charactersResponse.json() as Character[] : [];
        const tagData = tagsResponse.ok ? await tagsResponse.json() as Tag[] : [];
        setCharacters(chars); setTags(tagData); setSelected(chars.slice(0, 2));
      } finally { setLoading(false); }
    }
    void load();
  }, []);

  const tagMap = useMemo(() => new Map(tags.map(tag => [tag.name, tag])), [tags]);
  const selectedTagNames = useMemo(() => Array.from(new Set(selected.flatMap(character => character.tags ?? []))), [selected]);
  const selectedSupportEffects = useMemo(() => selectedTagNames.map(name => ({ name, tag: tagMap.get(name) })).filter(item => item.tag?.supportEffect), [selectedTagNames, tagMap]);

  const result = useMemo(() => {
    const selectedIds = new Set(selected.map(item => item.id));
    const counts = new Map<string, number>();
    selectedTagNames.forEach(tagName => {
      characters.forEach(character => { if ((character.tags ?? []).includes(tagName)) counts.set(character.id, (counts.get(character.id) ?? 0) + 1); });
    });
    return [...characters].filter(character => !selectedIds.has(character.id)).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)).slice(0, 3);
  }, [characters, selected, selectedTagNames]);

  const toggle = (character: Character) => setSelected(current => current.some(item => item.id === character.id) ? current.filter(item => item.id !== character.id) : current.length < 4 ? [...current, character] : current);
  const reset = () => { setSelected(characters.slice(0, 2)); setGoal(goals[0]); setGenerated(false); };

  return <GuideShell><PageIntro eyebrow="FORMATION LAB" title="サポート編成ビルダー" description="登録したキャラクタータグとタグごとのサポート効果を使って、編成候補と発動する効果を確認できます。" action={<div className="flex items-center gap-2 rounded-sm bg-blue-50 px-3 py-2 text-[10px] font-bold text-primary"><WandSparkles size={14} /> TAG ENGINE</div>} /><div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]"><div><section className="rounded-md border border-card-border bg-card p-5 shadow-card sm:p-7"><div className="data-label mb-2">STEP 01</div><h2 className="text-lg font-black">目的を選択</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{goals.map(item => <button key={item} onClick={() => { setGoal(item); setGenerated(false); }} className={`rounded-sm border px-3 py-3 text-xs font-bold ${goal === item ? "border-primary bg-blue-50 text-primary" : "border-border text-muted-foreground hover:border-primary"}`}>{item}</button>)}</div></section><section className="mt-4 rounded-md border border-card-border bg-card p-5 shadow-card sm:p-7"><div className="data-label mb-2">STEP 02</div><div className="flex items-center justify-between"><h2 className="text-lg font-black">使うキャラクター</h2><span className="font-data text-[10px] text-muted-foreground">{selected.length} / 4 SELECTED</span></div><p className="mt-1 text-xs text-muted-foreground">最大4人。キャラクターに登録されたタグを自動で読み込みます。</p>{loading ? <p className="mt-5 text-xs text-muted-foreground">キャラクターを読み込み中…</p> : <div className="mt-5 grid gap-2 sm:grid-cols-2">{characters.map(character => { const active = selected.some(item => item.id === character.id); return <button key={character.id} onClick={() => toggle(character)} className={`flex items-center gap-3 rounded-sm border p-2.5 text-left ${active ? "border-primary bg-blue-50" : "border-border hover:border-primary/50"}`}><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-sm bg-secondary">{character.imageUrl ? <img src={character.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-[9px] font-black text-muted-foreground">NO IMAGE</span>}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{character.name}</p><p className="text-[10px] text-muted-foreground">{character.role?.base} / {character.tier}</p></div>{active && <Check size={16} className="text-primary" />}</button>})}</div>}<div className="mt-6 flex justify-end"><button onClick={() => setGenerated(true)} disabled={selected.length < 1 || loading} className="flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"><Sparkles size={15} />サポート効果を計算 <ArrowRight size={14} /></button></div></section>{selected.length > 0 && <section className="mt-4 rounded-md border border-card-border bg-card p-5 shadow-card sm:p-7"><div className="data-label mb-2">TAG EFFECTS</div><h2 className="text-lg font-black">選択キャラから発動対象になるタグ</h2>{selectedTagNames.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">キャラクタータグが登録されていません。</p> : <div className="mt-4 space-y-3">{selectedTagNames.map(name => { const tag = tagMap.get(name); return <div key={name} className="rounded-md border border-border bg-background p-3"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">{name}</span>{tag?.supportCategory && <span className="text-[10px] text-muted-foreground">{tag.supportCategory}</span>}</div>{tag?.supportEffect ? <p className="mt-2 text-xs leading-6">{tag.supportEffect}</p> : <p className="mt-2 text-xs text-muted-foreground">サポート効果は未登録です。</p>}</div>})}</div>}</section>}{generated && <section className="mt-6 animate-enter rounded-md border border-primary/25 bg-card p-5 shadow-card sm:p-7"><div className="data-label text-primary">GENERATED RESULT / {goal}</div><h2 className="mt-1 text-lg font-black">タグ一致候補</h2><p className="mt-1 text-xs text-muted-foreground">選択キャラと共通タグが多いキャラクターを候補として表示しています。</p><div className="mt-5 grid gap-2 sm:grid-cols-3">{result.map((character, index) => <Link key={character.id} href={`/characters/${character.id}`} className="flex items-center gap-2 rounded-sm bg-secondary/70 p-2"><span className="font-data text-[10px] text-primary">0{index + 1}</span><div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm bg-secondary">{character.imageUrl ? <img src={character.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div><span className="truncate text-xs font-bold">{character.name}</span></Link>)}</div></section>}</div><aside className="space-y-4"><SidebarCard title="現在の条件"><div className="flex items-center justify-between border-b border-border pb-3"><span className="text-xs text-muted-foreground">目的</span><span className="text-xs font-black text-primary">{goal}</span></div><div className="flex items-center justify-between pt-3"><span className="text-xs text-muted-foreground">選択数</span><span className="font-data text-xs font-bold">{selected.length} / 4</span></div><button onClick={reset} className="mt-4 flex w-full items-center justify-center gap-1 border-t border-border pt-3 text-[10px] font-bold text-muted-foreground hover:text-primary"><RotateCcw size={12} />最初からやり直す</button></SidebarCard><div className="rounded-md border border-border bg-secondary/60 p-4"><p className="text-xs font-black">タグ管理との連動</p><p className="mt-2 text-xs leading-5 text-muted-foreground">管理画面でタグ名やサポート時の効果を変更すると、このページの候補計算と効果表示に反映されます。</p></div></aside></div></GuideShell>;
}
