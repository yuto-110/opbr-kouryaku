// 新しい管理画面・公開画面（共通アイテム／イベントミッション）用の共通処理。
// 既存ページの API_BASE_URL / TOKEN_KEY と同じ値を使う。
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

export const TOKEN_KEY = "opbr_access_token";

export function authHeaders(): Record<string, string> {
  const token = window.localStorage.getItem(TOKEN_KEY) ?? "";
  return { Authorization: `Bearer ${token}` };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** JSONのAPI呼び出し。失敗時はサーバーのmessageを持つ ApiError を投げる。 */
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; admin?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.admin ? authHeaders() : {}),
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.message ?? `リクエストに失敗しました（HTTP ${response.status}）`,
        response.status,
      );
    }
    return data as T;
  } catch (reason) {
    if (reason instanceof ApiError) throw reason;
    if (reason instanceof DOMException && reason.name === "AbortError") {
      throw new ApiError(
        "サーバーからの応答がありませんでした。Renderの無料プランでは起動に1〜2分かかることがあります。",
        0,
      );
    }
    throw new ApiError(
      "サーバーに接続できませんでした。APIが停止中または再起動中の可能性があります。",
      0,
    );
  } finally {
    window.clearTimeout(timer);
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return window.btoa(binary);
}

/** 既存の画像アップロードAPI（POST /uploads/github）をそのまま利用する。 */
export async function uploadImageFile(file: File, prefix: string): Promise<string> {
  const data = await apiRequest<{ publicUrl?: string }>("/uploads/github", {
    method: "POST",
    admin: true,
    timeoutMs: 120_000,
    body: {
      folder: "characters", // 既存のチャレバト報酬画像と同じ保存先
      filename: `${prefix}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      contentType: file.type,
      contentBase64: await fileToBase64(file),
    },
  });

  const url = String(data?.publicUrl ?? "");
  if (!url) throw new ApiError("画像URLを取得できませんでした", 0);
  return url;
}

// ---- 日本時間(JST)の扱い：ブラウザのタイムゾーンに依存しない ----
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO文字列 → <input type="datetime-local"> 用の JST 文字列 (YYYY-MM-DDTHH:mm) */
export function toJstInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 16);
}

/** <input type="datetime-local"> の値（JSTとして解釈） → ISO文字列。空なら null */
export function fromJstInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatJst(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${jstFormatter.format(date)} (JST)`;
}

export type EventStatus = "upcoming" | "ongoing" | "ended";

export function getEventStatus(startDate: string, endDate: string, now = Date.now()): EventStatus {
  if (now < new Date(startDate).getTime()) return "upcoming";
  if (now <= new Date(endDate).getTime()) return "ongoing";
  return "ended";
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: "開催予定",
  ongoing: "開催中",
  ended: "終了",
};

export const EVENT_STATUS_STYLE: Record<EventStatus, string> = {
  upcoming: "border-yellow-200 bg-yellow-50 text-yellow-700",
  ongoing: "border-red-200 bg-red-50 text-red-700",
  ended: "border-gray-200 bg-gray-100 text-gray-600",
};
