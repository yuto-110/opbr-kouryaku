import { ArrowLeft, Bookmark, Check, ChevronRight, Shield, Sparkles, Zap } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getMedal, medals, characters } from '@/data/mockData';
import { ArtPlaceholder, CharacterCard, GuideShell, PageIntro, RarityBadge, SidebarCard } from '@/components/guide-shell';
import { useState } from 'react';

export default function MedalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const medal = getMedal(id);
  const [saved, setSaved] = useState(false);

  if (!medal) {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ERROR / 404"
          title="メダルが見つかりません"
          description="指定されたデータはまだ登録されていないか、削除されました。"
          action={<Link href="/medals" className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90">一覧に戻る</Link>}
        />
      </GuideShell>
    );
  }

  const recommendedCharacterObjects = medal.recommendedCharacters
    .map((charId) => characters.find((c) => c.id === charId))
    .filter((c): c is typeof characters[0] => c !== undefined);

  const relatedMedals = medals
    .filter(
      (item) =>
        item.id !== medal.id && (item.category === medal.category || item.tags.some((tag) => medal.tags.includes(tag)))
    )
    .slice(0, 2);

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link href="/medals" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary" data-testid="link-back-medal-list">
          <ArrowLeft size={14} /> メダル一覧に戻る
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* メインコンテンツ */}
          <div>
            {/* ヘッダーセクション */}
            <section className="rounded-md border border-card-border bg-card shadow-card">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                <ArtPlaceholder color={medal.color} label="MEDAL" className="h-[180px] w-[140px] shrink-0 rounded-md" />
                <div className="flex-1">
                  <h1 className="mb-3 text-3xl font-black leading-tight">{medal.name}</h1>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <RarityBadge rarity={medal.rarity} />
                    <span className="inline-flex items-center rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">{medal.category}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-sm font-bold text-primary">{medal.effect}</div>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button onClick={() => setSaved(!saved)} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${saved ? 'bg-primary text-white' : 'border border-border bg-background hover:bg-secondary'}`} data-testid="button-save-medal">
                    <Bookmark size={16} /> {saved ? '保存済み' : '保存'}
                  </button>
                </div>
              </div>
            </section>

            {/* メダル詳細説明 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">メダル説明</h2>
              <p className="leading-relaxed text-foreground">{medal.detail}</p>
            </section>

            {/* 効果の詳細 */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary">
                  <Sparkles size={16} /> 主な効果
                </h2>
                <div className="rounded-md bg-primary/5 p-3">
                  <p className="text-sm font-bold text-primary">{medal.effect}</p>
                </div>
              </div>

              <div className="rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-600">
                  <Zap size={16} /> カテゴリー
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  <span className="text-lg font-bold text-foreground">{medal.category}</span>
                </div>
              </div>
            </section>

            {/* タグ */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">タグ</h2>
              <div className="flex flex-wrap gap-2">
                {medal.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* メダルの強み */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-green-600">
                <Check size={16} /> このメダルが活躍する場面
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-green-600">✓</span>
                  <div>
                    <p className="font-bold text-foreground">継続火力が必要な場面</p>
                    <p className="text-xs text-muted-foreground">ボス戦やレイドバトルで長期的なダメージを稼げる</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-green-600">✓</span>
                  <div>
                    <p className="font-bold text-foreground">対複数敵戦</p>
                    <p className="text-xs text-muted-foreground">複数の敵を同時に処理する必要がある場面</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-green-600">✓</span>
                  <div>
                    <p className="font-bold text-foreground">編成内での相乗効果</p>
                    <p className="text-xs text-muted-foreground">特定のキャラクターと組み合わせると効果がアップ</p>
                  </div>
                </li>
              </ul>
            </section>

            {/* おすすめキャラクター */}
            {recommendedCharacterObjects.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">このメダルが活躍するキャラクター</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendedCharacterObjects.map((character) => (
                    <CharacterCard key={character.id} character={character} />
                  ))}
                </div>
              </section>
            )}

            {/* 関連メダル */}
            {relatedMedals.length > 0 && (
              <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
                <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">関連メダル</h2>
                <div className="space-y-2">
                  {relatedMedals.map((relatedMedal) => (
                    <Link
                      key={relatedMedal.id}
                      href={`/medals/${relatedMedal.id}`}
                      className="flex items-center justify-between rounded-md border border-card-border bg-background p-3 transition hover:bg-secondary"
                    >
                      <div>
                        <div className="font-bold">{relatedMedal.name}</div>
                        <div className="text-xs text-muted-foreground">{relatedMedal.category}</div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 入手方法 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">入手方法</h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="shrink-0">📌</span>
                  <span>ガチャで入手可能</span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0">📌</span>
                  <span>イベントの報酬で獲得可能</span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0">📌</span>
                  <span>メダルピースを集めて製造可能</span>
                </div>
              </div>
            </section>

            {/* 編成例 */}
            <section className="mt-6 rounded-md border border-card-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted-foreground">このメダルを使った編成例</h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="mb-2 font-bold">速度重視の火力編成</div>
                  <p className="text-xs text-muted-foreground">このメダルに速度系メダルを組み合わせて、素早い敵を倒す編成</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="mb-2 font-bold">バランス型の安定編成</div>
                  <p className="text-xs text-muted-foreground">攻撃と防御のバランスを取りながら、安定した火力を発揮する編成</p>
                </div>
              </div>
            </section>
          </div>

          {/* サイドバー */}
          <aside className="space-y-5">
            <SidebarCard title="メダル情報">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-muted-foreground">RARITY</span>
                  <div>
                    <RarityBadge rarity={medal.rarity} />
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">CATEGORY</span>
                  <div className="font-bold">{medal.category}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-bold text-muted-foreground">TAG COUNT</span>
                  <div className="font-bold">{medal.tags.length}個</div>
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="効果の強さ">
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">攻撃補正</span>
                    <span className="font-bold text-foreground">高</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[85%] bg-red-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">防御補正</span>
                    <span className="font-bold text-foreground">中</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[50%] bg-blue-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">汎用性</span>
                    <span className="font-bold text-foreground">高</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[80%] bg-green-500" />
                  </div>
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="相乗効果">
              <div className="space-y-2 text-xs">
                <div className="rounded-md border border-border bg-background p-2">
                  <div className="font-bold text-foreground">火傷関連のメダル</div>
                  <p className="text-muted-foreground">火傷効果を強化するメダルと相性が良い</p>
                </div>
                <div className="rounded-md border border-border bg-background p-2">
                  <div className="font-bold text-foreground">攻撃重視キャラ</div>
                  <p className="text-muted-foreground">攻撃力が高いキャラクターに最適</p>
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="使用ガイド">
              <div className="space-y-2 text-xs text-muted-foreground">
                <Link href="/medals" className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-secondary">
                  <span>📋</span>
                  <span>メダル一覧</span>
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
