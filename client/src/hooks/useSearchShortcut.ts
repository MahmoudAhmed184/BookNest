import { useEffect, useState, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { routePaths } from "../routes/paths";

const searchShortcutSelector = '[data-search-shortcut-target="true"]';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function focusSearchInput(ref?: RefObject<HTMLInputElement | null>): boolean {
  const target =
    ref?.current ??
    document.querySelector<HTMLInputElement>(searchShortcutSelector);

  if (!target) return false;

  target.focus();
  target.select();
  return true;
}

export function useSearchShortcut(
  ref?: RefObject<HTMLInputElement | null>
): void {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingFocus, setPendingFocus] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();

      if (focusSearchInput(ref)) return;

      setPendingFocus(true);
      navigate(routePaths.search);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, ref]);

  useEffect(() => {
    if (!pendingFocus) return;

    const frame = window.requestAnimationFrame(() => {
      setPendingFocus(!focusSearchInput(ref));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, pendingFocus, ref]);
}
