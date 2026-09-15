import { ArrowLeft, Bookmark, Check, ChevronRight, Heart, Share2, Zap, Shield, Sword, Users } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { characters, getCharacter, medals, getTag } from '@/data/mockData';
import { ArtPlaceholder, GuideShell, MedalCard, PageIntro, RarityBadge, SidebarCard, StatBar } from '@/components/guide-shell';
import { useState } from 'react';

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const character = getCharacter(id);
  const [saved, setSaved] = useState(false);

  if (!character) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="キャラクターが見つかりません"
          description="指定されたデータはまだ登録されていないか、削除されました。"
          action={<Link href="/characters" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90">一覧に戻る</Link>}
        />
      </GuideShell>
    );
  }

  const recommendedMedalObjects = character.recommendedMedals
    .map((medalId) => medals.find((m) => m.id === medalId))
    .filter((m): m is typeof medals[0] => m !== undefined);

  const relatedCharacterObjects = character.relatedCharacters
    .map((charId) => characters.find((c) => c.id === charId))
    .filter((c): c is typeof characters[0] => c !== undefined);

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/characters" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary" data-testid="link-back-character-list">
          <ArrowLeft size={14} /> キャラクター一覧に戻る
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* メインコンテンツ */}
          <div>
            {/* ヘッダーセクション */}
            <section className="rounded-md border border-card-border bg-card shadow-card">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                <ArtPlaceholder color={character.color} label={character.element} className="h-[180px] w-[140px] shrink-0 rounded-md" />
                <div className="flex-1">
                  <div className="mb-2 text-xs text-muted-foreground">{character.reading}</div>
                  <h1 className="mb-3 text-3xl font-black leading-tight">{character.name}</h1>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <RarityBadge rarity={character.rarity} />
                    <span className="inline-flex items-center rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">{character.role}</span>
                    <span className="inline-flex items-center rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">{character.faction}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-primary">評価: <span className="text-lg">{character.tier}</span></div>
                    <div className="text-xs text-muted-foreground">更新: {character.update}</div>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button onClick={() => setSaved(!saved)} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${saved ? 'bg-primary text-white' : 'border border-border bg-background hover:bg-secondary'}`} data-testid="button-save-character">
                    <Bookmark size={16} /> {saved ? '保存済み' : '保存'}
                  </button>
                  <button className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-secondary" data-testid="button-share-character">
                    <Share2 size={16} /> シェア
                  </button>
                </div>
              </div>
            </section>

            {/* 説明文 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">キャラクター説明</h2>
              <p className="leading-relaxed text-foreground">{character.description}</p>
            </section>

            {/* ステータス */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">ステータス</h2>
              <div className="space-y-3">
                {character.stats.map((stat) => (
                  <StatBar key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
            </section>

            {/* タグ */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">タグ</h2>
              <div className="flex flex-wrap gap-2">
                {character.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* スキル */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                <Zap size={16} /> スキル
              </h2>
              <div className="space-y-4">
                {character.skills.map((skill, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-b-0">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="font-bold text-foreground">{skill.name}</h3>
                      <span className="text-[10px] font-bold text-muted-foreground">CT: {skill.cooldown}秒</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 特性 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                <Sword size={16} /> 特性
              </h2>
              <div className="space-y-4">
                {character.traits.map((trait, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-b-0">
                    <h3 className="mb-1 font-bold text-foreground">{trait.name}</h3>
                    <p className="text-sm text-muted-foreground">{trait.effect}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 強み・弱み */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-green-600">
                  <Check size={16} /> 強い点
                </h2>
                <ul className="space-y-2">
                  {character.strengths.map((strength, index) => (
                    <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-green-600">•</span> {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-red-600">
                  <Shield size={16} /> 弱い点
                </h2>
                <ul className="space-y-2">
                  {character.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-red-600">•</span> {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* おすすめメダル */}
            {recommendedMedalObjects.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">おすすめメダル</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendedMedalObjects.map((medal) => (
                    <MedalCard key={medal.id} medal={medal} />
                  ))}
                </div>
              </section>
            )}

            {/* 関連キャラクター */}
            {relatedCharacterObjects.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                  <Users size={16} /> 関連キャラクター
                </h2>
                <div className="space-y-2">
                  {relatedCharacterObjects.map((relatedChar) => (
                    <Link
                      key={relatedChar.id}
                      href={`/characters/${relatedChar.id}`}
                      className="flex items-center justify-between rounded-md border border-card-border bg-background p-3 transition hover:bg-secondary"
                    >
                      <div>
                        <div className="text-xs text-muted-foreground">{relatedChar.reading}</div>
                        <div className="font-bold">{relatedChar.name}</div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* サイドバー */}
          <aside className="space-y-5">
            <SidebarCard title="基本情報">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-muted-foreground">FACTION</span>
                  <div className="font-bold">{character.faction}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">ROLE</span>
                  <div className="font-bold">{character.role}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">ELEMENT</span>
                  <div className="font-bold">{character.element}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">RARITY</span>
                  <div className="font-bold">{character.rarity}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">TIER</span>
                  <div className="font-bold text-lg text-primary">{character.tier}</div>
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="最新ニュース">
              <div className="space-y-3">
                <div className="flex gap-2 border-b border-border pb-3">
                  <span className="shrink-0 font-bold text-primary">{character.update}</span>
                  <span className="text-xs text-muted-foreground">最新評価を更新</span>
                </div>
                <p className="text-xs text-muted-foreground">このキャラクターについての更新情報はまだ登録されていません。</p>
              </div>
            </SidebarCard>

            <SidebarCard title="攻略ガイド">
              <div className="space-y-2 text-xs text-muted-foreground">
                <Link href="/strategy" className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-secondary">
                  <span>📖</span>
                  <span>関連攻略記事</span>
                </Link>
                <Link href="/support" className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-secondary">
                  <span>⚙️</span>
                  <span>編成シミュレーター</span>
                </Link>
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </GuideShell>
  );
}
