type CharacterIconOverlayProps = {
  imageUrl: string;
  className?: string;
};

const HEXAGON_CLIP_PATH =
  "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const INNER_HEXAGON_CLIP_PATH =
  "polygon(27% 2%, 73% 2%, 98% 50%, 73% 98%, 27% 98%, 2% 50%)";

export function CharacterIconOverlay({
  imageUrl,
  className = "",
}: CharacterIconOverlayProps) {
  return (
    <div
      aria-hidden
      className={`absolute left-2 top-2 z-10 overflow-hidden ${className}`.trim()}
      style={{ clipPath: HEXAGON_CLIP_PATH }}
    >
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-contain"
        style={{ clipPath: INNER_HEXAGON_CLIP_PATH }}
      />
    </div>
  );
}
