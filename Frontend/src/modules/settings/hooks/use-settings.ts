import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ApiErrorPayload } from "@/lib/axios"
import { getSettings, updateSettingsGroup, getPlatformConfig } from "../api/settings-api"
import { settingsQueryKeys } from "../constants/query-keys"
import type { AllSettings, PlatformConfigResponse } from "../types/settings-types"

export function useSettingsQuery() {
  return useQuery<AllSettings, ApiErrorPayload>({
    queryKey: settingsQueryKeys.lists(),
    queryFn: getSettings,
  })
}

export function useUpdateSettingsGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    ApiErrorPayload,
    { groupId: keyof AllSettings; values: AllSettings[keyof AllSettings] }
  >({
    mutationFn: ({ groupId, values }) =>
      updateSettingsGroup(groupId, values as never),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.group(groupId),
      })
      // Also invalidate platform-config queries to reflect settings immediately
      queryClient.invalidateQueries({ queryKey: ["platform-config"] })
    },
  })
}

export function usePlatformConfigQuery(
  application: "admin" | "customer" | "delivery"
) {
  return useQuery<PlatformConfigResponse, ApiErrorPayload>({
    queryKey: ["platform-config", application],
    queryFn: () => getPlatformConfig(application),
    staleTime: 5 * 60 * 1000,
  })
}
