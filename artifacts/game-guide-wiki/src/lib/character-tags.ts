/**
 * キャラクタータグの表示名への変換。
 * キャラの tags には、タグ名（現行の保存形式）またはタグID（"tag-" + 12桁の16進）が入っている可能性がある。
 * どちらでも表示はタグ名にする。保存値は変更しない。
 * キャラタグとメダルタグは別のマスターなので、必ず /character-tags から取得したマスターを渡すこと。
 */
export type TagMasterLite = { id: string; name: string };

const TAG_ID_PATTERN = /^tag-[0-9a-f]{12}$/;

export function looksLikeTagId(value: string): boolean {
  return TAG_ID_PATTERN.test(value);
}

/** 表示名を返す。IDで、対応するタグが見つからない（削除済み・取得失敗）場合は null（IDは画面に出さない） */
export function resolveTagName(value: string, masters: TagMasterLite[]): string | null {
  const byId = masters.find((master) => master.id === value);
  if (byId) return byId.name;
  return looksLikeTagId(value) ? null : value;
}

/** 重複を除き、すべてのタグ名を返す（件数の制限はしない） */
export function resolveTagNames(values: string[] | undefined, masters: TagMasterLite[]): string[] {
  const names: string[] = [];
  for (const value of values ?? []) {
    const name = resolveTagName(value, masters);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}
