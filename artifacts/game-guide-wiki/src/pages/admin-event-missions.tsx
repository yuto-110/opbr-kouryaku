import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";
import { RewardIcon } from "@/components/reward-icon";
import { PublishToggle } from "@/components/publish-toggle";
import { RewardItemPicker } from "@/components/reward-item-picker";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_STYLE,
  apiRequest,
  formatJst,
  fromJstInput,
  getEventStatus,
  toJstInput,
  uploadImageFile,
} from "@/lib/admin-api";
import { useFormDraft } from "@/lib/use-form-draft";
import { aggregateRewards, type RewardItemOption, type RewardRow } from "@/lib/reward-items";

// 画面で入力するのは「ミッション内容(condition)」と「報酬(rewards)」だけ。
// name / requiredCount / deadline / published は旧データ互換のため値を保持し、そのまま送り返す（画面には出さない）。
type MissionForm = {
  id: string;
  condition: string;
  rewards: RewardRow[];
  name: string;
  requiredCount: number;
  deadline: string; // JSTの datetime-local 値
  published: boolean;
};

type EventForm = {
  name: string;
  eventCategory: string;
  description: string;
  imageUrl: string;
  startDate: string; // JSTの datetime-local 値
  endDate: string;
  published: boolean;
  sortOrder: number | "";
  missions: MissionForm[];
};

type EventSummary = {
  id: string;
  name: string;
  eventCategory: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  published: boolean;
  missionCount: number;
  publishedMissionCount: number;
};

const DRAFT_PREFIX = "opbr_event_mission_draft:v1:";

function newMissionId() {
  return `mission-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

const emptyMission = (): MissionForm => ({
  id: newMissionId(),
  condition: "",
  rewards: [],
  name: "",
  requiredCount: 1,
  deadline: "",
  published: true,
});

const emptyEvent = (): EventForm => ({
  name: "",
  eventCategory: "ミッション",
  description: "",
  imageUrl: "",
  startDate: "",
  endDate: "",
  published: true, // 新規登録は最初から公開（管理者がオフにできる）
  sortOrder: 0,
  missions: [],
});

function numberOrEmpty(value: unknown): number | "" {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function sanitizeRewards(value: unknown): RewardRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      itemId: typeof row.itemId === "string" ? row.itemId : "",
      quantity: numberOrEmpty(row.quantity),
    };
  });
}

/** 下書き（localStorage）から読んだ値を安全な形に整える */
function sanitizeEventForm(raw: unknown): EventForm | null {
  if (!raw || typeof raw !== "object") return null;
  const form = raw as Record<string, unknown>;
  const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

  return {
    name: text(form.name),
    eventCategory: text(form.eventCategory, "ミッション"),
    description: text(form.description),
    imageUrl: text(form.imageUrl),
    startDate: text(form.startDate),
    endDate: text(form.endDate),
    published: form.published === true,
    sortOrder: numberOrEmpty(form.sortOrder),
    missions: (Array.isArray(form.missions) ? form.missions : []).map((entry) => {
      const mission = (entry ?? {}) as Record<string, unknown>;
      return {
        id: text(mission.id) || newMissionId(),
        condition: text(mission.condition),
        rewards: sanitizeRewards(mission.rewards),
        name: text(mission.name),
        requiredCount:
          typeof mission.requiredCount === "number" && mission.requiredCount >= 1
            ? mission.requiredCount
            : 1,
        deadline: text(mission.deadline),
        published: mission.published !== false,
      };
    }),
  };
}

function detailToForm(detail: any): EventForm {
  return {
    name: detail.name ?? "",
    eventCategory: detail.eventCategory ?? "ミッション",
    description: detail.description ?? "",
    imageUrl: detail.imageUrl ?? "",
    startDate: toJstInput(detail.startDate),
    endDate: toJstInput(detail.endDate),
    published: detail.published === true,
    sortOrder: typeof detail.sortOrder === "number" ? detail.sortOrder : 0,
    missions: (detail.missions ?? []).map((mission: any) => ({
      id: mission.id,
      condition: mission.condition ?? "",
      rewards: (mission.rewards ?? []).map((reward: any) => ({
        itemId: reward.itemId,
        quantity: reward.quantity,
      })),
      name: mission.name ?? "",
      requiredCount: typeof mission.requiredCount === "number" ? mission.requiredCount : 1,
      deadline: toJstInput(mission.deadline),
      published: mission.published !== false,
    })),
  };
}

/** クライアント側の入力チェック（サーバー側でも同じ内容を検証する） */
function validateForm(form: EventForm): string | null {
  if (!form.name.trim()) return "イベント名を入力してください";
  const start = fromJstInput(form.startDate);
  const end = fromJstInput(form.endDate);
  if (!start) return "開始日時を入力してください";
  if (!end) return "終了日時を入力してください";
  if (new Date(end).getTime() <= new Date(start).getTime()) return "終了日時は開始日時より後にしてください";

  for (let i = 0; i < form.missions.length; i += 1) {
    const mission = form.missions[i];
    const label = `ミッション${i + 1}`;
    if (!mission.condition.trim() && !mission.name.trim()) return `${label}のミッション内容を入力してください`;
    for (const reward of mission.rewards) {
      if (!reward.itemId) return `${label}：報酬アイテムを選択してください`;
      if (!Number.isInteger(reward.quantity) || (reward.quantity as number) < 1) {
        return `${label}：報酬の個数は1以上の整数で入力してください`;
      }
    }
  }
  return null;
}

function buildPayload(form: EventForm, imageUrl: string) {
  return {
    name: form.name.trim(),
    eventCategory: form.eventCategory.trim() || "ミッション",
    description: form.description,
    imageUrl,
    startDate: fromJstInput(form.startDate),
    endDate: fromJstInput(form.endDate),
    published: form.published,
    sortOrder: form.sortOrder === "" ? 0 : form.sortOrder,
    missions: form.missions.map((mission) => ({
      id: mission.id,
      name: mission.name,
      condition: mission.condition,
      requiredCount: mission.requiredCount,
      deadline: mission.deadline ? fromJstInput(mission.deadline) : null,
      published: mission.published,
      rewards: mission.rewards.map((reward) => ({ itemId: reward.itemId, quantity: reward.quantity })),
    })),
  };
}

function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function AdminEventMissionsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [items, setItems] = useState<RewardItemOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<EventForm>(emptyEvent());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const draft = useFormDraft<EventForm>({
    prefix: DRAFT_PREFIX,
    contextId: editingId,
    value: form,
    sanitize: sanitizeEventForm,
  });

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  async function loadEvents() {
    setEvents(await apiRequest<EventSummary[]>("/admin/event-missions", { admin: true }));
  }

  useEffect(() => {
    draft.enter(null, emptyEvent());
    void (async () => {
      try {
        const [, itemData] = await Promise.all([
          loadEvents(),
          apiRequest<{ items: RewardItemOption[] }>("/admin/reward-items", { admin: true }),
        ]);
        setItems(itemData.items);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "データを取得できませんでした");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(
    () => aggregateRewards(form.missions.flatMap((mission) => mission.rewards)),
    [form.missions],
  );

  const draftDirty = draft.status.kind === "pending" || draft.status.kind === "saved";

  function patchMission(index: number, patch: Partial<MissionForm>) {
    setForm((current) => ({
      ...current,
      missions: current.missions.map((mission, i) => (i === index ? { ...mission, ...patch } : mission)),
    }));
  }

  function patchReward(missionIndex: number, rewardIndex: number, patch: Partial<RewardRow>) {
    setForm((current) => ({
      ...current,
      missions: current.missions.map((mission, i) =>
        i !== missionIndex
          ? mission
          : {
              ...mission,
              rewards: mission.rewards.map((reward, r) => (r === rewardIndex ? { ...reward, ...patch } : reward)),
            },
      ),
    }));
  }

  async function startEdit(id: string) {
    setError("");
    setMessage("");
    try {
      const detail = await apiRequest<any>(`/admin/event-missions/${id}`, { admin: true });
      const nextForm = detailToForm(detail);
      draft.enter(id, nextForm); // 今の入力を下書きに残してから切り替える
      setEditingId(id);
      setForm(nextForm);
      setImageFile(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "イベントを取得できませんでした");
    }
  }

  function cancelEdit() {
    if (draftDirty && !window.confirm("未保存の入力内容を破棄しますか？（この編集の下書きも削除されます）")) return;
    draft.clear(editingId);
    setEditingId(null);
    setForm(emptyEvent());
    draft.enter(null, emptyEvent());
    setImageFile(null);
    setError("");
    setMessage("");
  }

  function restoreDraft() {
    const restored = draft.accept();
    if (restored) {
      setForm(restored);
      setMessage("下書きを復元しました。内容を確認して「保存」を押してください。");
      setError("");
    }
  }

  async function save() {
    setError("");
    setMessage("");

    const invalid = validateForm(form);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    try {
      const imageUrl = imageFile ? await uploadImageFile(imageFile, "event-mission") : form.imageUrl;
      const savingId = editingId;

      await apiRequest(savingId ? `/admin/event-missions/${savingId}` : "/admin/event-missions", {
        method: savingId ? "PUT" : "POST",
        admin: true,
        body: buildPayload(form, imageUrl),
        timeoutMs: 90_000,
      });

      // ここに来た時点でDB保存が完了している
      draft.clear(savingId);
      setEditingId(null);
      setForm(emptyEvent());
      setImageFile(null);
      draft.enter(null, emptyEvent());
      setMessage("イベントを保存しました");

      try {
        await loadEvents();
      } catch {
        setError("保存は完了しましたが、一覧の再読み込みに失敗しました。ページを再読み込みして確認してください。");
      }
    } catch (reason) {
      // 失敗してもフォームと下書きは残す（自動再送信はしない）
      setError(
        `${reason instanceof Error ? reason.message : "保存に失敗しました"} 入力内容はそのまま残っており、下書きにも保存されています。`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(event: EventSummary) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/event-missions/${event.id}/published`, {
        method: "PATCH",
        admin: true,
        body: { published: !event.published },
      });
      setMessage(event.published ? "非公開にしました" : "公開しました");
      await loadEvents();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "公開状態を変更できませんでした");
    }
  }

  async function removeEvent(event: EventSummary) {
    if (!window.confirm(`「${event.name}」を削除しますか？この操作は取り消せません。\n（終了後も残したい場合は「非公開」にしてください）`)) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/event-missions/${event.id}`, { method: "DELETE", admin: true });
      draft.clear(event.id);
      if (editingId === event.id) {
        setEditingId(null);
        setForm(emptyEvent());
        draft.enter(null, emptyEvent());
      }
      setMessage("削除しました");
      await loadEvents();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "削除に失敗しました");
    }
  }

  const inputClass = "mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm";

  return (
    <GuideShell>
      <PageIntro
        eyebrow="ADMIN / EVENT MISSIONS"
        title="イベントミッション管理"
        description="期間限定イベントと、そのミッション・報酬を登録します。報酬は共通アイテム管理のアイテムから選びます。"
        action={
          <div className="flex gap-2">
            <Link href="/admin/items" className="rounded-md border border-border px-3 py-2 text-xs font-bold">共通アイテム管理</Link>
            <Link href="/admin" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold">
              <ArrowLeft size={14} />管理画面へ
            </Link>
          </div>
        }
      />

      {message ? <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {/* ---------- 入力フォーム ---------- */}
      <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-black">{editingId ? "イベントを編集" : "イベントを登録"}</h2>

        {draft.pending ? (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700" data-testid="banner-draft-restore">
            <p className="font-bold">未保存の入力内容を復元しますか？</p>
            <p className="mt-1 text-xs">
              {editingId ? "このイベントの編集中だった内容" : "登録途中だった新規イベントの内容"}が、この端末のブラウザに下書きとして残っています
              {draft.pending.savedAt ? `（${new Date(draft.pending.savedAt).toLocaleString("ja-JP")} に自動保存）` : ""}。
              復元しても、「保存」を押すまでデータベースの内容は変わりません。
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={restoreDraft} className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white">復元する</button>
              <button type="button" onClick={draft.discard} className="rounded border border-border px-3 py-1.5 text-xs">破棄する</button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-bold">
            イベント名
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} data-testid="input-event-name" />
          </label>
          <label className="block text-xs font-bold">
            イベントカテゴリ
            <input value={form.eventCategory} onChange={(e) => setForm({ ...form, eventCategory: e.target.value })} className={inputClass} placeholder="例：ミッション" />
          </label>
          <label className="block text-xs font-bold md:col-span-2">
            説明
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
          </label>
          <label className="block text-xs font-bold">
            開始日時（日本時間）
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} data-testid="input-event-start" />
          </label>
          <label className="block text-xs font-bold">
            終了日時（日本時間）
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} data-testid="input-event-end" />
          </label>
          <label className="block text-xs font-bold">
            表示順（小さいほど上）
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value === "" ? "" : Number(e.target.value) })}
              className={inputClass}
            />
          </label>
          <div className="self-end">
            <PublishToggle
              checked={form.published}
              onChange={(published) => setForm({ ...form, published })}
              testId="checkbox-event-published"
            />
          </div>

          <div className="md:col-span-2">
            <p className="mb-1 text-xs font-bold">バナー画像</p>
            <div className="flex flex-wrap items-center gap-3">
              <RewardIcon imageUrl={form.imageUrl} name={form.name} size={56} />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] ?? null)}
                className="text-xs"
              />
            </div>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="または画像URL（https://…）"
              className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* ---------- ミッション ---------- */}
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-black">ミッション（{form.missions.length}件）</h3>
            <button
              type="button"
              onClick={() => setForm({ ...form, missions: [...form.missions, emptyMission()] })}
              className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs font-bold"
              data-testid="button-add-mission"
            >
              <Plus size={14} />ミッションを追加
            </button>
          </div>

          {form.missions.length === 0 ? (
            <p className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              ミッションがまだありません。「ミッションを追加」から登録してください。
            </p>
          ) : null}

          <div className="space-y-4">
            {form.missions.map((mission, index) => (
              <div key={mission.id} className="rounded-md border border-border bg-background p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black">ミッション {index + 1}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" aria-label="上へ" disabled={index === 0} onClick={() => setForm({ ...form, missions: move(form.missions, index, -1) })} className="rounded border border-border p-1.5 disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button type="button" aria-label="下へ" disabled={index === form.missions.length - 1} onClick={() => setForm({ ...form, missions: move(form.missions, index, 1) })} className="rounded border border-border p-1.5 disabled:opacity-30"><ArrowDown size={14} /></button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`ミッション${index + 1}を削除しますか？`)) {
                          setForm({ ...form, missions: form.missions.filter((_, i) => i !== index) });
                        }
                      }}
                      className="rounded border border-red-200 p-1.5 text-red-600"
                      aria-label="ミッションを削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <label className="block text-xs font-bold">
                  ミッション内容
                  <textarea
                    value={mission.condition}
                    onChange={(e) => patchMission(index, { condition: e.target.value })}
                    rows={3}
                    placeholder="例：バトルを10回プレイする"
                    className={inputClass}
                    data-testid={`input-mission-condition-${index}`}
                  />
                </label>
                {mission.name || mission.deadline || mission.requiredCount !== 1 || !mission.published ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    既存データを保持しています：
                    {mission.name ? `名前「${mission.name}」 ` : ""}
                    {mission.requiredCount !== 1 ? `達成数 ${mission.requiredCount} ` : ""}
                    {mission.deadline ? `期限 ${mission.deadline.replace("T", " ")} ` : ""}
                    {!mission.published ? "非公開" : ""}
                  </p>
                ) : null}

                {/* 報酬 */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-black">報酬（{mission.rewards.length}件）</p>
                    <button
                      type="button"
                      onClick={() => patchMission(index, { rewards: [...mission.rewards, { itemId: "", quantity: 1 }] })}
                      className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[11px] font-bold"
                    >
                      <Plus size={12} />報酬を追加
                    </button>
                  </div>

                  <div className="space-y-2">
                    {mission.rewards.map((reward, rewardIndex) => (
                      <div key={rewardIndex} className="rounded border border-card-border bg-card p-2.5">
                        <div className="flex items-start gap-2">
                          <RewardIcon imageUrl={itemMap.get(reward.itemId)?.imageUrl} name={itemMap.get(reward.itemId)?.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <RewardItemPicker
                              items={items}
                              value={reward.itemId}
                              onChange={(itemId) => patchReward(index, rewardIndex, { itemId })}
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs font-bold">
                            個数
                            <input
                              type="number"
                              min={1}
                              value={reward.quantity}
                              onChange={(e) => patchReward(index, rewardIndex, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                              className="w-28 rounded border border-border bg-background px-2 py-1.5 text-sm"
                            />
                          </label>
                          <div className="flex gap-1.5">
                            <button type="button" aria-label="報酬を上へ" disabled={rewardIndex === 0} onClick={() => patchMission(index, { rewards: move(mission.rewards, rewardIndex, -1) })} className="rounded border border-border p-1.5 disabled:opacity-30"><ArrowUp size={13} /></button>
                            <button type="button" aria-label="報酬を下へ" disabled={rewardIndex === mission.rewards.length - 1} onClick={() => patchMission(index, { rewards: move(mission.rewards, rewardIndex, 1) })} className="rounded border border-border p-1.5 disabled:opacity-30"><ArrowDown size={13} /></button>
                            <button type="button" aria-label="報酬を削除" onClick={() => patchMission(index, { rewards: mission.rewards.filter((_, r) => r !== rewardIndex) })} className="rounded border border-red-200 p-1.5 text-red-600"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- 報酬合計 ---------- */}
        <div className="mt-8 rounded-md border border-card-border bg-background p-4" data-testid="section-reward-totals">
          <h3 className="text-base font-black">報酬の合計（アイテム別）</h3>
          <p className="mb-3 mt-1 text-[11px] text-muted-foreground">
            対象：このイベントの全{form.missions.length}ミッションの報酬です。
          </p>
          {totals.length === 0 ? (
            <p className="text-xs text-muted-foreground">報酬が設定されていません。</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {totals.map((total) => {
                const item = itemMap.get(total.itemId);
                return (
                  <div key={total.itemId} className="flex items-center gap-2 rounded bg-secondary/60 p-2">
                    <RewardIcon imageUrl={item?.imageUrl} name={item?.name} size={32} />
                    <p className="min-w-0 break-words text-xs font-bold">
                      {item?.name ?? "（不明なアイテム）"} <span className="text-primary">× {total.quantity.toLocaleString("ja-JP")}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------- 保存 ---------- */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            data-testid="button-save-event"
          >
            <Save size={14} />
            {saving ? "データベースに保存中…" : editingId ? "変更を保存" : "イベントを保存"}
          </button>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 rounded border border-border px-4 py-2.5 text-xs">
              <X size={14} />編集をやめる
            </button>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-muted-foreground" data-testid="text-draft-status">
          {draft.status.kind === "pending" ? "未保存の変更があります（下書きに保存中…）" : null}
          {draft.status.kind === "saved" ? `下書きを自動保存しました（${draft.status.at}）。まだデータベースには保存されていません。` : null}
          {draft.status.kind === "idle" ? "未保存の変更はありません。" : null}
        </p>
        {draft.status.kind === "error" ? (
          <p className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
            下書きを自動保存できません（ブラウザの保存容量不足やプライベートブラウズの可能性があります）。ページを閉じる前に必ず「保存」を押してください。
          </p>
        ) : null}
      </section>

      {/* ---------- イベント一覧 ---------- */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-black">登録済みイベント</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">読み込み中…</p>
        ) : events.length === 0 ? (
          <p className="rounded-md border border-card-border bg-card p-4 text-sm text-muted-foreground">まだイベントがありません。</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const status = getEventStatus(event.startDate, event.endDate);
              return (
                <div key={event.id} className="rounded-md border border-card-border bg-card p-4 shadow-card" data-testid={`card-admin-event-${event.id}`}>
                  {/* 情報：画面幅いっぱいを使い、イベント名は通常の文章として折り返す */}
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${EVENT_STATUS_STYLE[status]}`}>{EVENT_STATUS_LABEL[status]}</span>
                      <span className="rounded border border-border px-2 py-0.5 text-[10px] font-bold">{event.published ? "公開中" : "非公開"}</span>
                      <span className="text-[10px] text-muted-foreground">ミッション {event.missionCount}件</span>
                    </div>
                    <h3 className="break-words text-sm font-black leading-snug">{event.name}</h3>
                    <dl className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
                      <div className="flex gap-2"><dt className="w-8 shrink-0">開始</dt><dd>{formatJst(event.startDate)}</dd></div>
                      <div className="flex gap-2"><dt className="w-8 shrink-0">終了</dt><dd>{formatJst(event.endDate)}</dd></div>
                    </dl>
                  </div>

                  {/* 操作：情報とは別の行。幅が足りなければ折り返す */}
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <button type="button" onClick={() => void startEdit(event.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-border px-3 py-2 text-[11px] font-bold sm:flex-none"><Pencil size={12} />編集</button>
                    <button type="button" onClick={() => void togglePublished(event)} className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-border px-3 py-2 text-[11px] font-bold sm:flex-none">
                      {event.published ? <EyeOff size={12} /> : <Eye size={12} />}
                      {event.published ? "非公開にする" : "公開する"}
                    </button>
                    <button type="button" onClick={() => void removeEvent(event)} className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-red-200 px-3 py-2 text-[11px] font-bold text-red-600 sm:flex-none"><Trash2 size={12} />削除</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </GuideShell>
  );
}
