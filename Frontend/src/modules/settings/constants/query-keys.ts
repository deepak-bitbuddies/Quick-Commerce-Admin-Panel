export const settingsQueryKeys = {
  all: ["settings"] as const,
  lists: () => [...settingsQueryKeys.all, "list"] as const,
  group: (groupId: string) => [...settingsQueryKeys.all, "group", groupId] as const,
}
