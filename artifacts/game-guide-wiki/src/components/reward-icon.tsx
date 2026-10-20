import { useEffect, useState } from "react";
import { Gift } from "lucide-react";

/** 報酬アイテムの画像。未設定・読み込み失敗でも崩れないようにプレースホルダーを出す。 */
export function RewardIcon({
  imageUrl,
  name,
  size = 40,
}: {
  imageUrl?: string | null;
  name?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const style = { width: size, height: size };

  if (!imageUrl || failed) {
    return (
      <div
        className="grid shrink-0 place-items-center rounded bg-background text-muted-foreground"
        style={style}
        aria-hidden="true"
      >
        <Gift size={Math.round(size * 0.45)} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name ?? ""}
      className="shrink-0 rounded object-contain"
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
