/**
 * サイト全体の共通設定。
 * - SITE_URL（正式なURL）は環境変数 VITE_SITE_URL で与える。未設定の間は canonical / og:url を出力しない
 *   （独自ドメインが決まる前に、存在しないURLを書かないため）。
 * - 運営者情報・連絡先は、運営者が実際の内容を設定するまで「未設定」として扱い、勝手な値を表示しない。
 */
export const SITE_NAME = "OPBR攻略+";

export const SITE_TAGLINE = "ONE PIECE バウンティラッシュの非公式攻略データベース";

export const DEFAULT_TITLE = "OPBR攻略+｜バウンティラッシュ攻略・キャラ性能・メダルデータベース";

export const DEFAULT_DESCRIPTION =
  "ONE PIECE バウンティラッシュのキャラクター、メダル、チャレンジバトル、イベントミッションの情報を確認できる非公式の攻略データベースです。";

/** 例: https://example.com （末尾スラッシュなし）。未設定なら空文字 */
export const SITE_URL: string = String(import.meta.env.VITE_SITE_URL ?? "").trim().replace(/\/+$/, "");

/** 運営者が公開してよい情報だけを入れる。空のままなら画面には「準備中」と表示する */
export const OPERATOR_INFO = {
  /** 例: 運営者名（ハンドルネーム可） */
  name: "",
  /** 例: お問い合わせフォームのURL（https://…） */
  contactUrl: "",
  /** 例: 連絡用メールアドレス */
  contactEmail: "",
};

/** 運営情報ページの最終更新日（内容を変更したら更新する） */
export const LEGAL_LAST_UPDATED = "2026年10月30日";
