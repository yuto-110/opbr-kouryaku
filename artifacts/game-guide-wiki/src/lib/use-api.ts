import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/admin-api";

export type ApiState<T> = { data: T | null; loading: boolean; error: boolean };

/** 公開APIを1回取得する（認証なし）。失敗時は data=null / error=true（架空のデータで埋めない） */
export function useApiData<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: false });
    apiRequest<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
