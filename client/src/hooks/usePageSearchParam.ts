import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface SetPageOptions {
  replace?: boolean;
}

interface UsePageSearchParamResult {
  page: number;
  setPage: (page: number, options?: SetPageOptions) => void;
}

function normalizePage(value: number): number {
  if (!Number.isFinite(value)) return 1;

  return Math.max(1, Math.floor(value));
}

function parsePage(value: string | null): number {
  if (!value) return 1;

  return normalizePage(Number.parseInt(value, 10));
}

export function usePageSearchParam(
  paramName = "page"
): UsePageSearchParamResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = useMemo(
    () => parsePage(searchParams.get(paramName)),
    [paramName, searchParams]
  );

  const setPage = useCallback(
    (nextPage: number, options?: SetPageOptions): void => {
      const normalizedPage = normalizePage(nextPage);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set(paramName, String(normalizedPage));

      if (options?.replace) {
        setSearchParams(nextSearchParams, { replace: true });
        return;
      }

      setSearchParams(nextSearchParams);
    },
    [paramName, searchParams, setSearchParams]
  );

  useEffect(() => {
    if (searchParams.get(paramName) === String(page)) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set(paramName, String(page));
    setSearchParams(nextSearchParams, { replace: true });
  }, [page, paramName, searchParams, setSearchParams]);

  return { page, setPage };
}
