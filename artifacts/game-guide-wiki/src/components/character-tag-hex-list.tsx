const HEXAGON_CLIP_PATH = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

type CharacterTagHexListProps = {
  tags: string[];
  className?: string;
  onTagClick?: (tag: string) => void;
};

export function CharacterTagHexList({
  tags,
  className = "",
  onTagClick,
}: CharacterTagHexListProps) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap items-start gap-1.5 ${className}`.trim()}>
      {tags.map((tag) => {
        const commonClassName =
          "inline-flex min-h-7 max-w-[88px] items-center justify-center bg-primary/90 px-3 py-1 text-center text-[10px] font-black leading-[1.2] text-white shadow-sm whitespace-normal break-words [overflow-wrap:anywhere]";

        if (onTagClick) {
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className={`${commonClassName} hover:bg-primary`}
              style={{ clipPath: HEXAGON_CLIP_PATH }}
            >
              {tag}
            </button>
          );
        }

        return (
          <span
            key={tag}
            className={commonClassName}
            style={{ clipPath: HEXAGON_CLIP_PATH }}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}

export { HEXAGON_CLIP_PATH };
