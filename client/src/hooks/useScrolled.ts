import { useEffect, useState } from "react";

export function useScrolled(threshold = 48): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsScrolled(false);
      return;
    }

    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.position = "absolute";
    sentinel.style.top = `${threshold}px`;
    sentinel.style.left = "0";
    sentinel.style.width = "1px";
    sentinel.style.height = "1px";
    sentinel.style.pointerEvents = "none";
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry?.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [threshold]);

  return isScrolled;
}
