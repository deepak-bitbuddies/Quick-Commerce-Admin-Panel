export const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "list"] as const,
  list: (filters: unknown) => [...productsQueryKeys.lists(), filters] as const,
  details: () => [...productsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
}

export const badgesQueryKeys = {
  all: ["badges"] as const,
  lists: () => [...badgesQueryKeys.all, "list"] as const,
  list: (filters: unknown) => [...badgesQueryKeys.lists(), filters] as const,
  details: () => [...badgesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...badgesQueryKeys.details(), id] as const,
}
