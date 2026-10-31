import { useEffect } from "react";
import { useLocation } from "wouter";
import { applySeo, isSeoOverridden, normalizePath, type SeoSpec } from "@/lib/seo";

type Rule = { pattern: RegExp; seo: SeoSpec };

/**
 * ルートごとの共通タイトル・説明。詳細ページは、データ取得後に useSeo で固有の内容に置き換わる。
 * noindex：検索結果に載せないページ。
 *  - 管理画面・ログイン・マイページ・設定：公開情報ではない
 *  - /events, /events/:id, /rankings, /strategy：現在サンプルデータで表示しているため（実データ化するまで）
 */
const RULES: Rule[] = [
  { pattern: /^\/$/, seo: {} },
  { pattern: /^\/characters$/, seo: { title: "キャラクター一覧", description: "登録されているキャラクターを、名前・属性・役職・評価・タグで検索できます。" } },
  { pattern: /^\/characters\/[^/]+$/, seo: { title: "キャラクター詳細", description: "キャラクターの評価・スキル・ステータス・タグを確認できます。" } },
  { pattern: /^\/medals$/, seo: { title: "メダル一覧", description: "登録されているメダルを、名前・固有特性・タグで検索できます。" } },
  { pattern: /^\/medals\/[^/]+$/, seo: { title: "メダル詳細", description: "メダルの固有特性・追加特性・メダルタグを確認できます。" } },
  { pattern: /^\/medal-tags\/[^/]+$/, seo: { title: "メダルタグ", description: "メダルタグのセット効果と、そのタグを持つメダルを確認できます。" } },
  { pattern: /^\/event-missions$/, seo: { title: "イベントミッション", description: "開催中・開催予定・終了したイベントミッションと、その報酬を確認できます。" } },
  { pattern: /^\/event-missions\/[^/]+$/, seo: { title: "イベントミッション詳細", description: "イベントミッションの内容と報酬、報酬の合計を確認できます。" } },
  { pattern: /^\/challenge-battles$/, seo: { title: "チャレンジバトル", description: "チャレンジバトルの開催期間と報酬を確認できます。" } },
  { pattern: /^\/challenge-battles\/[^/]+$/, seo: { title: "チャレンジバトル詳細", description: "チャレンジバトルの報酬一覧と報酬の合計を確認できます。" } },
  { pattern: /^\/support$/, seo: { title: "サポート編成", description: "キャラクターを選んで編成候補を確認できるツールです。" } },
  { pattern: /^\/about$/, seo: { title: "サイトについて", description: "OPBR攻略+の目的と、非公式の攻略サイトである旨をご案内します。" } },
  { pattern: /^\/contact$/, seo: { title: "お問い合わせ", description: "OPBR攻略+へのお問い合わせ方法をご案内します。" } },
  { pattern: /^\/privacy$/, seo: { title: "プライバシーポリシー", description: "OPBR攻略+での情報の取り扱いについて説明します。" } },
  { pattern: /^\/disclaimer$/, seo: { title: "免責事項", description: "OPBR攻略+の掲載内容に関する免責事項です。" } },
  // 検索結果に載せないページ
  { pattern: /^\/(events|events\/[^/]+|rankings|strategy)$/, seo: { title: "ページ（サンプル表示）", noindex: true } },
  { pattern: /^\/(admin(\/.*)?|auth|mypage|settings)$/, seo: { title: "管理・アカウント", noindex: true } },
];

export function RouteSeo() {
  const [location] = useLocation();

  useEffect(() => {
    // 詳細ページが固有のメタデータを設定済みなら、上書きしない
    if (isSeoOverridden()) return;
    const path = normalizePath(location);
    const rule = RULES.find((candidate) => candidate.pattern.test(path));
    // 未定義のURL（404ページ）は検索結果に載せない
    applySeo(rule ? rule.seo : { title: "ページが見つかりません", noindex: true });
  }, [location]);

  return null;
}
