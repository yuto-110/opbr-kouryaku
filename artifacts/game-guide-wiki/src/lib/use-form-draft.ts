import { useEffect, useRef, useState } from "react";

/**
 * 入力途中のフォームを localStorage に自動保存する汎用フック（正式なDB保存の代わりではない）。
 * - contextId ごと（新規 / 各ID）に別々の下書きとして保存する
 * - baseline（DBの内容または空フォーム）と同じなら下書きは作らない
 * - 復元確認(pending)中は自動保存を止め、保存済みの下書きを上書きしない
 * 認証トークンなどは保存しない（value にはフォーム入力値だけを渡すこと）。
 */
export type DraftStatus =
  | { kind: "idle" }
  | { kind: "pending" } // 変更あり・自動保存待ち
  | { kind: "saved"; at: string }
  | { kind: "error" };

type Stored<T> = { version: 1; savedAt: string; value: T };

export function useFormDraft<T>(options: {
  prefix: string;
  contextId: string | null;
  value: T;
  sanitize: (raw: unknown) => T | null;
  debounceMs?: number;
}) {
  const { prefix, contextId, value, sanitize } = options;
  const debounceMs = options.debounceMs ?? 800;

  const keyOf = (id: string | null) => `${prefix}${id ?? "new"}`;

  const baselineRef = useRef<string>("");
  const [pending, setPending] = useState<{ contextId: string | null; value: T; savedAt: string } | null>(null);
  const [status, setStatus] = useState<DraftStatus>({ kind: "idle" });

  const latest = useRef({ contextId, value, pending });
  latest.current = { contextId, value, pending };

  function read(id: string | null): { value: T; savedAt: string } | null {
    try {
      const raw = window.localStorage.getItem(keyOf(id));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Stored<unknown>>;
      if (parsed?.version !== 1) return null;
      const clean = sanitize(parsed.value);
      return clean ? { value: clean, savedAt: String(parsed.savedAt ?? "") } : null;
    } catch {
      return null;
    }
  }

  function remove(id: string | null) {
    try {
      window.localStorage.removeItem(keyOf(id));
    } catch {
      // 削除に失敗しても動作に影響しない
    }
  }

  function persist(id: string | null, current: T) {
    // enter() で基準が決まるまでは何も保存しない（初期の空フォームで既存の下書きを上書きしないため）
    if (!baselineRef.current) return;
    if (JSON.stringify(current) === baselineRef.current) {
      remove(id);
      setStatus({ kind: "idle" });
      return;
    }
    try {
      const stored: Stored<T> = { version: 1, savedAt: new Date().toISOString(), value: current };
      window.localStorage.setItem(keyOf(id), JSON.stringify(stored));
      setStatus({ kind: "saved", at: new Date().toLocaleTimeString("ja-JP") });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  function flush() {
    const l = latest.current;
    if (l.pending) return;
    persist(l.contextId, l.value);
  }

  const flushRef = useRef(flush);
  flushRef.current = flush;

  // 変更後、一定時間おいて自動保存
  useEffect(() => {
    if (pending) return;
    if (JSON.stringify(value) !== baselineRef.current) setStatus({ kind: "pending" });
    const timer = window.setTimeout(() => persist(contextId, value), debounceMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, contextId, pending]);

  // ページを離れる直前にも保存
  useEffect(() => {
    const onLeave = () => flushRef.current();
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  return {
    pending,
    status,
    /** 編集対象を切り替える：今の内容を保存し、基準を更新し、切替先の下書きがあれば確認を出す */
    enter(nextContextId: string | null, baselineValue: T) {
      flushRef.current();
      baselineRef.current = JSON.stringify(baselineValue);
      setStatus({ kind: "idle" });
      const draft = read(nextContextId);
      setPending(draft ? { contextId: nextContextId, ...draft } : null);
    },
    /** 復元する下書きを返し、確認状態を閉じる（フォームへの反映は呼び出し側） */
    accept(): T | null {
      const current = pending;
      setPending(null);
      return current ? current.value : null;
    },
    discard() {
      if (pending) remove(pending.contextId);
      setPending(null);
    },
    /** DBへの保存に成功したときなど：その下書きを削除 */
    clear(id: string | null) {
      remove(id);
    },
    markIdle() {
      setStatus({ kind: "idle" });
    },
  };
}
