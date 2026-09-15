import { Medal as MedalIcon, Swords, Trophy } from 'lucide-react';
import { Link } from 'wouter';
import { characters, medals } from '@/data/mockData';
import { ArtPlaceholder, GuideShell, PageIntro, RarityBadge, SidebarCard } from '@/components/guide-shell';

export default function RankingsPage() {
  const topCharacters = characters.slice().sort((a, b) => b.stats[0].value - a.stats[0].value);
  const topMedals = medals.slice(0, 4);
  return <GuideShell><PageIntro eyebrow="META RANKING" title="ランキング" description="現在の環境で使いやすいキャラクターとメダルを、編集部の評価順に掲載しています。" />
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-9">
        <section><div className="mb-4 flex items-center gap-2"><Swords size={17} className="text-primary" /><h2 className="text-lg font-black">キャラクターランキング</h2></div><div className="space-y-2">{topCharacters.map((character, index) => <Link key={character.id} href={`/characters/${character.id}`} className="interactive-card flex items-center gap-3 rounded-md border border-card-border bg-card p-3 shadow-card"><span className={`font-data w-8 text-center text-xl font-bold ${index === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{String(index + 1).padStart(2, '0')}</span><ArtPlaceholder color={character.color} label={character.element} className="h-14 w-14 rounded-sm" /><div className="min-w-0 flex-1"><div className="text-[10px] text-muted-foreground">{character.faction} / {character.role}</div><h3 className="truncate text-sm font-black">{character.name}</h3><div className="mt-1 flex gap-1">{character.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground">{tag}</span>)}</div></div><span className="font-data text-xl font-bold text-primary">{character.tier}</span></Link>)}</div></section>
        <section><div className="mb-4 flex items-center gap-2"><MedalIcon size={17} className="text-primary" /><h2 className="text-lg font-black">メダルランキング</h2></div><div className="grid gap-3 md:grid-cols-2">{topMedals.map((medal, index) => <Link key={medal.id} href={`/medals/${medal.id}`} className="interactive-card rounded-md border border-card-border bg-card p-4 shadow-card"><div className="flex items-start gap-3"><span className="font-data text-lg font-bold text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><div className="grid h-11 w-11 place-items-center rounded-sm text-white" style={{ background: medal.color }}>印</div><div className="min-w-0"><RarityBadge rarity={medal.rarity} /><h3 className="mt-1 truncate text-sm font-black">{medal.name}</h3><p className="mt-2 text-xs font-bold text-primary">{medal.effect}</p></div></div></Link>)}</div></section>
      </div>
      <aside><SidebarCard title="評価について"><div className="flex items-center gap-2 text-primary"><Trophy size={17} /><span className="text-sm font-black">総合評価</span></div><p className="mt-3 text-xs leading-6 text-muted-foreground">単体性能だけでなく、現行コンテンツへの適性、編成の組みやすさ、役割の代替性を含めて評価しています。</p></SidebarCard></aside>
    </div>
  </GuideShell>;
}