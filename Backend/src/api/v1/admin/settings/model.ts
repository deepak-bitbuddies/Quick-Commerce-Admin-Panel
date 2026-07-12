import { Schema, model, type InferSchemaType } from "mongoose"

const settingSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "general", "branding", etc.
    values: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
    },
    version: { type: Number, required: true, default: 1 },
    updatedBy: { type: String, required: true, default: "system" },
  },
  {
    timestamps: true,
    collection: "settings",
  },
)

export type SettingDocument = InferSchemaType<typeof settingSchema>
export const SettingModel = model("Setting", settingSchema)

// Audit log schema for keeping a history of changes
const settingAuditLogSchema = new Schema(
  {
    groupId: { type: String, required: true, index: true },
    changedBy: { type: String, required: true },
    oldValues: { type: Map, of: Schema.Types.Mixed },
    newValues: { type: Map, of: Schema.Types.Mixed, required: true },
    version: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "settings_audit_logs",
  },
)

export type SettingAuditLogDocument = InferSchemaType<typeof settingAuditLogSchema>
export const SettingAuditLogModel = model("SettingAuditLog", settingAuditLogSchema)
