export type RecognizedRewardKind =
  | "normal"
  | "passLite"
  | "passPremium";

export type RecognizedRewardStatus =
  | "recognized"
  | "merged"
  | "needs_review"
  | "failed";

export type RecognizedReward = {
  score: number | "";
  kind: RecognizedRewardKind;
  itemId: string;
  quantity: number | "";
  sourceImageIndexes: number[];
  status: RecognizedRewardStatus;
  note: string;
};

function sameReward(a: RecognizedReward, b: RecognizedReward) {
  return a.itemId === b.itemId && a.quantity === b.quantity;
}

/**
 * Images from Lite and Premium lanes both contain the normal row. Merge only
 * exact matches; a disagreement remains visible for administrator review.
 */
export function mergeRecognizedRewards(
  rewards: RecognizedReward[],
): RecognizedReward[] {
  const merged: RecognizedReward[] = [];
  for (const reward of rewards) {
    const score = typeof reward.score === "number" ? reward.score : NaN;
    if (!Number.isSafeInteger(score) || score < 0) {
      merged.push({ ...reward, status: "needs_review" });
      continue;
    }
    const existing = merged.find(
      (candidate) =>
        candidate.score === score && candidate.kind === reward.kind,
    );
    if (!existing) {
      merged.push({ ...reward, score });
      continue;
    }
    if (sameReward(existing, reward)) {
      existing.sourceImageIndexes = [
        ...new Set([...existing.sourceImageIndexes, ...reward.sourceImageIndexes]),
      ];
      if (existing.status === "recognized" && reward.status === "recognized") {
        existing.status = "merged";
      }
      existing.note = [existing.note, reward.note].filter(Boolean).join(" ");
    } else {
      existing.status = "needs_review";
      existing.note = "同じスコアに異なる報酬が検出されました。元画像を確認してください。";
    }
  }
  return merged.sort((a, b) => Number(a.score) - Number(b.score));
}
