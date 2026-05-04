import { useState, type ReactElement } from "react";

import { getFallbackHueStyle, getInitials } from "../../utils/profileDisplay";

export interface ReviewCoverProps {
  src?: string | null | undefined;
  title?: string | null | undefined;
}

export function ReviewCover({ src, title }: ReviewCoverProps): ReactElement {
  const [failed, setFailed] = useState(false);
  const canShowImage = Boolean(src) && !failed;
  const safeTitle = title || "Book";

  if (!canShowImage) {
    return (
      <div
        className="fallback-gradient flex h-52 min-w-36 items-center justify-center rounded-xl px-3 text-center text-2xl font-bold text-primary-white"
        style={getFallbackHueStyle(safeTitle)}
      >
        <span aria-hidden="true">{getInitials(safeTitle)}</span>
        <span className="sr-only">Cover unavailable for {safeTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src ?? undefined}
      className="h-52 min-w-36 rounded-xl object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
      alt={`Cover of ${safeTitle}`}
      width="144"
      height="208"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
