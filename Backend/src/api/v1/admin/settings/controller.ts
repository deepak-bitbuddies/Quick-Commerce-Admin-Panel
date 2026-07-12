import type { FastifyReply, FastifyRequest } from "fastify"

import { getSettingsList, saveSettingsGroup, fetchApplicationConfig } from "./service.js"
import { settingsValidators, updateSettingsGroupParamsSchema, platformConfigQuerySchema } from "./schema.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"

export async function getSettingsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const settings = await getSettingsList()
  sendSuccess(reply, settings, "Settings fetched successfully")
}

export async function getPlatformConfigHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { application } = validateSchema(platformConfigQuerySchema, request.query)
  const config = await fetchApplicationConfig(application)
  sendSuccess(reply, config, `Platform config resolved for application: ${application}`)
}

export async function updateSettingsGroupHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { groupId } = validateSchema(updateSettingsGroupParamsSchema, request.params)
  const validator = settingsValidators[groupId]
  const validatedValues = validateSchema(validator, request.body) as Record<string, any>
  const updatedBy = request.user?.id || "system"

  const updatedSettings = await saveSettingsGroup(groupId, validatedValues, updatedBy)
  sendSuccess(reply, updatedSettings, `Settings group '${groupId}' updated successfully`)
}
