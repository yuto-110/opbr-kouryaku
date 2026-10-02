import { useEffect, useState } from "react";

type CharacterHexIconProps = {
  src: string;
  alt?: string;
  className?: string;
};

function createTransparentHexDataUrl(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "";

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const isEdgeBackground = (index: number) => {
    const alpha = data[index + 3];
    if (alpha < 10) return true;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    const nearWhite = r > 242 && g > 242 && b > 242 && max - min < 12;
    const nearBlack = r < 28 && g < 28 && b < 28 && max - min < 14;
    return nearWhite || nearBlack;
  };

  const pushIfBackground = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) return;
    const index = pixelIndex * 4;
    if (!isEdgeBackground(index)) return;
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }

  while (queue.length > 0) {
    const pixelIndex = queue.shift();
    if (pixelIndex === undefined) break;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const dataIndex = pixelIndex * 4;
    data[dataIndex + 3] = 0;

    pushIfBackground(x + 1, y);
    pushIfBackground(x - 1, y);
    pushIfBackground(x, y + 1);
    pushIfBackground(x, y - 1);
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function CharacterHexIcon({ src, alt = "", className = "" }: CharacterHexIconProps) {
  const [transparentSrc, setTransparentSrc] = useState(src);

  useEffect(() => {
    if (typeof window === "undefined" || !src) {
      setTransparentSrc(src);
      return;
    }

    const cachedKey = `hex-icon-transparent:${src}`;
    const cached = window.sessionStorage.getItem(cachedKey);
    if (cached) {
      setTransparentSrc(cached);
      return;
    }

    setTransparentSrc(src);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      try {
        const dataUrl = createTransparentHexDataUrl(img);
        if (dataUrl) {
          window.sessionStorage.setItem(cachedKey, dataUrl);
          setTransparentSrc(dataUrl);
        }
      } catch {
        setTransparentSrc(src);
      }
    };

    img.onerror = () => {
      setTransparentSrc(src);
    };
  }, [src]);

  return <img src={transparentSrc || src} alt={alt} className={className} loading="lazy" />;
}
