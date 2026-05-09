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
        className="fallback-gradient flex h-40 w-28 items-center justify-center rounded-lg px-3 text-center text-xl font-bold text-primary-white"
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
      className="h-40 w-28 rounded-lg object-cover shadow-md transition-transform duration-200 ease-out hover:scale-[1.03]"
      alt={`Cover of ${safeTitle}`}
      width="112"
      height="160"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
