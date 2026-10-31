import { useEffect } from "react";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";

export type SeoSpec = {
  /** ページ固有のタイトル。サイト名は自動で付く（省略時はサイト全体のタイトル） */
  title?: string;
  description?: string;
  /** 検索結果に載せないページ（管理画面・ログイン・サンプル表示など） */
  noindex?: boolean;
  /** canonical に使うパス。省略時は現在のパス */
  path?: string;
};

// 詳細ページがデータ取得後に固有のタイトルを設定している間は、ルート共通の設定で上書きしない
let overrideActive = false;
export const isSeoOverridden = () => overrideActive;

const MAX_DESCRIPTION = 160;

export function cleanText(value: string, max = MAX_DESCRIPTION): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** URLの正規化：クエリ・ハッシュを除き、連続スラッシュと末尾スラッシュ（ルート以外）を取り除く */
export function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  return path.length > 1 ? path.replace(/\/+$/, "") : "/";
}

function setMeta(attr: "name" | "property", key: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function applySeo(spec: SeoSpec = {}) {
  const title = spec.title ? `${spec.title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const description = cleanText(spec.description ?? DEFAULT_DESCRIPTION);

  document.title = title;
  setMeta("name", "description", description);
  setMeta("name", "robots", spec.noindex ? "noindex, nofollow" : "index, follow");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);

  // 正式なURLが設定されている場合だけ canonical / og:url を出す（架空のURLは出さない）
  const canonical =
    !spec.noindex && SITE_URL ? `${SITE_URL}${normalizePath(spec.path ?? window.location.pathname)}` : null;
  setCanonical(canonical);
  setMeta("property", "og:url", canonical);
}

/**
 * 詳細ページ用。実データが取得できたら固有のタイトル・説明を設定する。
 * null の間（読み込み中）は何もしない → ルート共通の設定が使われ、別ページのメタデータは残らない。
 */
export function useSeo(spec: SeoSpec | null) {
  const key = spec ? JSON.stringify(spec) : "";
  useEffect(() => {
    if (!spec) return;
    overrideActive = true;
    applySeo(spec);
    return () => {
      overrideActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
