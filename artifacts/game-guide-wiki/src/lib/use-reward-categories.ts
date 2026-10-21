import { useState } from "react";

function read(storageKey: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : null;
  } catch {
    return null;
  }
}

/**
 * 報酬機能ごと（チャレバト／イベントミッション）の「報酬候補に含めるカテゴリ」の設定。
 * 保存場所はこのブラウザの localStorage。機能ごとに別のキーを使うので、互いに影響しない。
 * 保存がなければ defaults（機能ごとの初期設定）を使う。
 */
export function useRewardCategorySetting(
  storageKey: string,
  defaults: string[],
  allValues: string[],
) {
  const [stored, setStored] = useState<string[] | null>(() => read(storageKey));
  const value = stored ?? defaults;

  function toggle(category: string) {
    const next = new Set(value);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    const ordered = allValues.filter((candidate) => next.has(candidate));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(ordered));
    } catch {
      // 保存できなくても、この画面では反映される
    }
    setStored(ordered);
  }

  return { value, toggle };
}
