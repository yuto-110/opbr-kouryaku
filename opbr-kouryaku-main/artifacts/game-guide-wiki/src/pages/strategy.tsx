import {
  ArrowUpRight,
  BookOpenText,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'wouter';
import { articles } from '@/data/mockData';
import {
  GuideShell,
  PageIntro,
  SidebarCard,
} from '@/components/guide-shell';

const chapters = [
  {
    chapter: '第1章',
    title: '蒼い森の入り口',
    difficulty: 'NORMAL',
    note: '基礎操作とタグの組み合わせを覚える',
  },
  {
    chapter: '第2章',
    title: '紅蓮の試練',
    difficulty: 'HARD',
    note: '火傷と継続火力が有効',
  },
  {
    chapter: '第4章',
    title: '霧海の砦',
    difficulty: 'EXPERT',
    note: '速度操作で敵の初動を止める',
  },
];

export default function StrategyPage() {
  return (
    <GuideShell>
      <PageIntro
        eyebrow="STRATEGY ARCHIVE"
        title="攻略"
        description="章攻略、編成ガイド、初心者向けの立ち回りをまとめています。"
        action={
          <Link
            href="/support"
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-bold text-white"
          >
            編成ビルダーへ
            <ArrowUpRight size={14} />
          </Link>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <BookOpenText size={17} className="text-primary" />
              <h2 className="text-lg font-black">
                最新の攻略記事
              </h2>
            </div>

            <div className="space-y-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="interactive-card rounded-md border border-card-border bg-card p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-primary">
                    <span>{article.type}</span>
                    <span className="text-border">/</span>
                    <span className="font-data text-muted-foreground">
                      {article.date}
                    </span>

                    {article.readTime && (
                      <>
                        <span className="text-border">/</span>
                        <span className="font-data text-muted-foreground">
                          {article.readTime}
                        </span>
                      </>
                    )}

                    {typeof article.views === 'number' && (
                      <span className="ml-auto font-data text-muted-foreground">
                        {article.views.toLocaleString()} views
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-base font-black">
                    {article.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {article.summary}
                  </p>

                  <Link
                    href={`/strategy`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    記事を読む
                    <ChevronRight size={14} />
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-9">
            <div className="data-label mb-1">
              CHAPTER SELECT
            </div>

            <h2 className="mb-4 text-lg font-black">
              ステージ別攻略
            </h2>

            <div className="grid gap-3 md:grid-cols-3">
              {chapters.map((chapter) => (
                <div
                  key={chapter.chapter}
                  className="rounded-md border border-card-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-data text-[10px] text-primary">
                      {chapter.chapter}
                    </span>

                    <span className="font-data text-[9px] text-muted-foreground">
                      {chapter.difficulty}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-black">
                    {chapter.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {chapter.note}
                  </p>

                  <Link
                    href="/characters"
                    className="mt-4 flex items-center gap-1 text-[10px] font-bold text-primary"
                  >
                    おすすめを見る
                    <ChevronRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <SidebarCard title="人気の記事">
            <div className="space-y-4">
              {articles
                .slice()
                .reverse()
                .map((article, index) => (
                  <Link
                    key={article.id}
                    href="/strategy"
                    className="flex gap-3"
                  >
                    <span className="font-data text-lg font-bold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="text-xs font-bold leading-5">
                      {article.title}
                    </span>
                  </Link>
                ))}
            </div>
          </SidebarCard>

          <SidebarCard title="攻略の見方">
            <p className="text-xs leading-6 text-muted-foreground">
              記事内のタグは、キャラクターやメダルの一覧ページと共通です。
              気になるタグから相性の良いデータを探せます。
            </p>
          </SidebarCard>
        </aside>
      </div>
    </GuideShell>
  );
}