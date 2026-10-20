/**
 * 公開状態のチェックボックス（共通部品）。
 * 新規登録フォームでは、呼び出し側が初期値を true（公開）にする。
 * 編集時は、保存済みの現在の状態を渡す。
 */
export function PublishToggle({
  checked,
  onChange,
  label = "公開する",
  hint = "オフの間は一般ユーザーに表示されません",
  testId,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  testId?: string;
}) {
  return (
    <label className="flex items-start gap-2 text-xs font-bold">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        data-testid={testId}
      />
      <span>
        {label}
        <span className="block text-[11px] font-normal text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
