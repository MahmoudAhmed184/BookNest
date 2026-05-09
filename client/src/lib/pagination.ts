import type { OffsetPageParams, OffsetPaginatedResponse } from "../types/api";

function createEmptyOffsetPagination<T>(
  params: OffsetPageParams
): OffsetPaginatedResponse<T> {
  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
    page: params.page,
    pageSize: params.pageSize,
    totalPages: 0,
    hasNext: false,
    hasPrevious: params.page > 1,
  };
}

export function mergeOffsetPages<T>(
  pages: OffsetPaginatedResponse<T>[] | undefined,
  params: OffsetPageParams
): OffsetPaginatedResponse<T> {
  if (!pages?.length) return createEmptyOffsetPagination<T>(params);

  const lastPage = pages[pages.length - 1]!;

  return {
    ...lastPage,
    previous: null,
    results: pages.flatMap((page) => page.results),
    hasPrevious: false,
  };
}

export function getNextOffsetPageParam<T>(
  lastPage: OffsetPaginatedResponse<T>
): number | undefined {
  return lastPage.hasNext ? lastPage.page + 1 : undefined;
}

export function shouldLoadNextOffsetPage({
  targetPage,
  loadedPage,
  hasNextPage,
  isFetchingNextPage,
  isError,
}: {
  targetPage: number;
  loadedPage: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
}): boolean {
  return (
    targetPage > loadedPage &&
    hasNextPage &&
    !isFetchingNextPage &&
    !isError
  );
}
