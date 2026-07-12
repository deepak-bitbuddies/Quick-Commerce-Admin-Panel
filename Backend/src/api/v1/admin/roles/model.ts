import { Schema, model, type InferSchemaType } from "mongoose"

const roleSchema = new Schema(
  {
    _id: { type: String, required: true }, // GUID (UUIDv4)
    code: { type: String, required: true, unique: true, index: true }, // e.g. "super_admin", "customer", "delivery_boy"
    displayName: { type: String, required: true },
    description: { type: String },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "roles",
  },
)

export type RoleDocument = InferSchemaType<typeof roleSchema>
export const RoleModel = model("Role", roleSchema)
