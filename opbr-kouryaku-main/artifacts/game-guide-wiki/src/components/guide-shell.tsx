import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Bookmark, BookOpenText, ChevronRight, CircleUserRound, Compass, Database, ExternalLink, Hammer, Home, Menu, Search, Shield, Swords, Trophy, X } from 'lucide-react';
import type { Character, Medal } from '@/data/mockData';

const navItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/characters', label: 'キャラクター', icon: Swords },
  { href: '/medals', label: 'メダル', icon: Shield },
  { href: '/support', label: 'サポート編成', icon: Hammer },
  { href: '/strategy', label: '攻略', icon: BookOpenText },
  { href: '/rankings', label: 'ランキング', icon: Trophy },
];

export function GuideShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-mobile-logo">
            <BrandMark small />
            <span className="text-sm font-black tracking-[.12em]">覇道データベース</span>
          </Link>
          <button onClick={() => setMobileOpen((value) => !value)} className="rounded-md p-2 text-foreground hover:bg-secondary" aria-label="メニューを開く" data-testid="button-mobile-menu">
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t border-border bg-white px-3 py-3">
            {navItems.map((item) => <NavItem key={item.href} {...item} active={location === item.href} mobile onNavigate={() => setMobileOpen(false)} />)}
            <NavItem href="/mypage" label="マイページ" icon={CircleUserRound} active={location === '/mypage'} mobile onNavigate={() => setMobileOpen(false)} />
          </nav>
        )}
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-6 py-6">
          <Link href="/" className="flex items-center gap-3" data-testid="link-sidebar-logo">
            <BrandMark />
            <div>
              <div className="text-[15px] font-black tracking-[.12em] text-white">覇道</div>
              <div className="font-data text-[9px] tracking-[.16em] text-slate-400">DATABASE / 01</div>
            </div>
          </Link>
        </div>
        <div className="px-4 pt-8">
          <p className="data-label mb-3 px-3 text-slate-500">NAVIGATION</p>
          <nav className="space-y-1">
            {navItems.map((item) => <NavItem key={item.href} {...item} active={location === item.href} />)}
          </nav>
        </div>
        <div className="mt-9 px-4">
          <p className="data-label mb-3 px-3 text-slate-500">PERSONAL</p>
          <NavItem href="/mypage" label="マイページ" icon={CircleUserRound} active={location === '/mypage'} />
          <Link href="/mypage" className="app-link mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white" data-testid="link-bookmarks">
            <Bookmark size={17} /> ブックマーク
          </Link>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-5">
          <div className="rounded-md border border-sidebar-border bg-white/[.04] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300"><Database size={14} className="text-sky-400" /> DATA STATUS</div>
            <div className="mt-2 flex items-end justify-between"><span className="font-data text-[10px] text-slate-500">LAST SYNC</span><span className="font-data text-[10px] text-slate-300">2024.06.18</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-[78%] bg-sky-500" /></div>
          </div>
        </div>
      </aside>

      <main className="min-h-[100dvh] lg:pl-[238px]">
        <Topbar />
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

function BrandMark({ small = false }: { small?: boolean }) {
  return <div className={`${small ? 'h-8 w-8' : 'h-10 w-10'} relative grid place-items-center rounded-sm bg-primary text-primary-foreground`}><span className={`font-black ${small ? 'text-sm' : 'text-lg'}`}>覇</span><span className="absolute bottom-0.5 right-1 font-data text-[7px] opacity-70">01</span></div>;
}

function NavItem({ href, label, icon: Icon, active, mobile, onNavigate }: { href: string; label: string; icon: typeof Home; active: boolean; mobile?: boolean; onNavigate?: () => void }) {
  return <Link href={href} onClick={onNavigate} className={`app-link flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold ${mobile ? 'mb-1' : ''} ${active ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`} data-testid={`link-nav-${label}`}><Icon size={17} strokeWidth={active ? 2.5 : 1.8} /><span>{label}</span>{active && <ChevronRight size={14} className="ml-auto opacity-70" />}</Link>;
}

function Topbar() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  return <div className="hidden h-[72px] items-center justify-between border-b border-border bg-white px-10 lg:flex">
    <div className="font-data text-[10px] tracking-[.16em] text-muted-foreground">HADO DATABASE <span className="mx-2 text-border">/</span> LIVE GUIDE</div>
    <div className="flex items-center gap-5">
      <label className="flex h-9 w-[280px] items-center gap-2 rounded-md border border-border bg-background px-3 text-muted-foreground focus-within:border-primary">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && query.trim()) setLocation(`/characters?search=${encodeURIComponent(query.trim())}`); }} placeholder="データベースを検索" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70" data-testid="input-global-search" />
        <span className="font-data text-[9px] text-muted-foreground/70">⌘K</span>
      </label>
      <Link href="/mypage" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary" data-testid="link-top-mypage"><CircleUserRound size={19} /> マイページ</Link>
    </div>
  </div>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
    <div><div className="data-label mb-2 flex items-center gap-2"><span className="section-rule" /> {eyebrow}</div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}

export function SectionHeader({ eyebrow, title, href, linkLabel = 'すべて見る' }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-4 flex items-end justify-between"><div><div className="data-label mb-1">{eyebrow}</div><h2 className="text-lg font-black">{title}</h2></div>{href && <Link href={href} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid={`link-section-${title}`}>{linkLabel}<ChevronRight size={14} /></Link>}</div>;
}

export function ArtPlaceholder({ color = '#1e5aa8', label = 'HADO', className = '' }: { color?: string; label?: string; className?: string }) {
  return <div className={`relative isolate overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${color}, #172944)` }}>
    <div className="absolute -right-7 -top-7 h-32 w-32 rounded-full border-[18px] border-white/10" /><div className="absolute -bottom-10 -left-8 h-36 w-36 rotate-12 border border-white/20" />
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(120deg, transparent 45%, rgba(255,255,255,.32) 46%, transparent 47%), linear-gradient(30deg, transparent 63%, rgba(255,255,255,.18) 64%, transparent 65%)' }} />
    <div className="relative flex h-full items-center justify-center"><div className="text-center text-white"><div className="font-data text-[9px] tracking-[.4em] opacity-70">{label}</div><div className="mt-1 text-4xl font-black opacity-90">覇</div></div></div>
  </div>;
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const style: Record<string, string> = { 伝説: 'bg-amber-50 text-amber-700 border-amber-200', 超激レア: 'bg-blue-50 text-blue-700 border-blue-200', 激レア: 'bg-cyan-50 text-cyan-700 border-cyan-200', レア: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold ${style[rarity] || style.レア}`}>{rarity}</span>;
}

export function CharacterCard({ character }: { character: Character }) {
  return <Link href={`/characters/${character.id}`} className="interactive-card group flex overflow-hidden rounded-md border border-card-border bg-card shadow-card" data-testid={`card-character-${character.id}`}>
    <ArtPlaceholder color={character.color} label={character.element} className="h-[126px] w-[92px] shrink-0" />
    <div className="min-w-0 flex-1 p-3.5"><div className="flex items-start justify-between gap-2"><div><div className="text-[10px] text-muted-foreground">{character.reading}</div><h3 className="truncate text-sm font-black group-hover:text-primary">{character.name}</h3></div><span className="font-data text-lg font-bold text-primary">{character.tier}</span></div><div className="mt-2 flex items-center gap-1.5"><RarityBadge rarity={character.rarity} /><span className="text-[10px] text-muted-foreground">{character.role}</span></div><div className="mt-3 flex gap-1.5">{character.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground">{tag}</span>)}</div></div>
  </Link>;
}

export function MedalCard({ medal }: { medal: Medal }) {
  return <Link href={`/medals/${medal.id}`} className="interactive-card group rounded-md border border-card-border bg-card p-4 shadow-card" data-testid={`card-medal-${medal.id}`}><div className="flex gap-3"><div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-sm text-white" style={{ background: medal.color }}><div className="absolute inset-1 rounded-sm border border-white/30" /><span className="font-black">印</span></div><div className="min-w-0"><div className="mb-1 flex items-center gap-2"><RarityBadge rarity={medal.rarity} /><span className="text-[10px] text-muted-foreground">{medal.category}</span></div><h3 className="truncate text-sm font-black group-hover:text-primary">{medal.name}</h3></div></div><p className="mt-3 text-xs font-bold leading-5 text-foreground/80">{medal.effect}</p><div className="mt-3 flex gap-1.5">{medal.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-secondary-foreground">{tag}</span>)}</div></Link>;
}

export function SidebarCard({ title, children, href }: { title: string; children: ReactNode; href?: string }) {
  return <section className="rounded-md border border-card-border bg-card p-4 shadow-card"><div className="mb-3 flex items-center justify-between border-b border-border pb-3"><h3 className="text-sm font-black">{title}</h3>{href && <Link href={href} className="text-[10px] font-bold text-primary" data-testid={`link-sidebar-${title}`}>一覧</Link>}</div>{children}</section>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="rounded-md border border-dashed border-border bg-card py-16 text-center"><Compass className="mx-auto text-muted-foreground/50" size={28} /><p className="mt-3 text-sm font-bold text-muted-foreground">{label}</p></div>;
}

export function ExternalSourceLink({ label }: { label: string }) {
  return <button onClick={() => navigator.clipboard?.writeText(label)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary" data-testid={`button-source-${label}`}><ExternalLink size={12} /> {label}</button>;
}

export function StatBar({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-3"><span className="w-8 text-[10px] font-bold text-muted-foreground">{label}</span><div className="h-1.5 flex-1 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div><span className="font-data w-7 text-right text-[10px] text-muted-foreground">{value}</span></div>;
}