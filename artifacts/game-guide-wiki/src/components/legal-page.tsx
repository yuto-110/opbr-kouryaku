import type { ReactNode } from "react";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

/** 運営情報ページ共通の枠（見出し・最終更新日・本文の体裁） */
export function LegalPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <GuideShell>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <article className="max-w-3xl space-y-6 rounded-md border border-card-border bg-card p-5 text-sm leading-7 shadow-card sm:p-7">
        {children}
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">最終更新日：{LEGAL_LAST_UPDATED}</p>
      </article>
    </GuideShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-black">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
