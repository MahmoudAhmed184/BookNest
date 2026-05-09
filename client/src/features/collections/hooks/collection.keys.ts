export const collectionKeys = {
  all: ["collections"] as const,
  list: () => [...collectionKeys.all, "list"] as const,
  items: () => [...collectionKeys.all, "items"] as const,
  detail: (id: string | undefined) => [...collectionKeys.all, "detail", id] as const,
} as const;
