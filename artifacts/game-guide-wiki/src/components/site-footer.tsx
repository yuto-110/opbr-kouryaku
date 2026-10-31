import { Link } from "wouter";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/about", label: "サイトについて" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/disclaimer", label: "免責事項" },
];

/** 全ページ共通のフッター：運営情報ページへのリンクと、非公式サイトである旨の表示 */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground" data-testid="site-footer">
      <nav aria-label="運営情報" className="flex flex-wrap gap-x-5 gap-y-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="font-bold hover:text-primary">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 leading-5">
        {SITE_NAME}は、ONE PIECE バウンティラッシュの運営元とは関係のない、非公式のファンによる攻略サイトです。
        ゲーム内の名称・画像などの権利は、各権利者に帰属します。
      </p>
      <p className="mt-2">© {SITE_NAME}</p>
    </footer>
  );
}
