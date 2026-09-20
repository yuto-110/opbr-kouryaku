import { useEffect, useState } from "react";

type CharacterIconOverlayProps = {
  imageUrl: string;
  className?: string;
};

const WHITE_THRESHOLD = 245;

function removeEdgeConnectedWhite(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("キャラクターアイコンの画像処理に失敗しました");
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const isWhite = (index: number) =>
    data[index + 3] > 0 &&
    data[index] >= WHITE_THRESHOLD &&
    data[index + 1] >= WHITE_THRESHOLD &&
    data[index + 2] >= WHITE_THRESHOLD;

  const enqueue = (x: number, y: number) => {
    const position = y * width + x;
    if (visited[position]) return;
    visited[position] = 1;
    const index = position * 4;
    if (isWhite(index)) queue.push(position);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const position = queue[cursor];
    const x = position % width;
    const y = Math.floor(position / width);
    data[position * 4 + 3] = 0;

    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function CharacterIconOverlay({
  imageUrl,
  className = "",
}: CharacterIconOverlayProps) {
  const [processedImageUrl, setProcessedImageUrl] = useState(imageUrl);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const result = removeEdgeConnectedWhite(image);
        if (!cancelled) setProcessedImageUrl(result);
      } catch (error) {
        console.error("キャラクターアイコンの背景透明化に失敗しました", error);
      }
    };
    image.onerror = () => {
      console.error("キャラクターアイコンを読み込めませんでした", imageUrl);
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <div
      aria-hidden
      className={`absolute left-2 top-2 z-10 ${className}`.trim()}
    >
      <img
        src={processedImageUrl}
        alt=""
        className="h-full w-full object-contain"
      />
    </div>
  );
}
