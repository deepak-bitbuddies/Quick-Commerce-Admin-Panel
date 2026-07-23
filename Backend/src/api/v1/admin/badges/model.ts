import { Schema, model, type InferSchemaType } from "mongoose"

import { BadgeStatus } from "./enums.js"
import type { WithId } from "../../../../shared/types/mongoose-helpers.js"

const badgeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // Server-derived lowercase mirror of `name` for unique constraint
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Visual colors (e.g. Hex `#EF4444` or Tailwind style classes)
    color: { type: String, required: true, trim: true, default: "#E4E4E7" }, // background color
    textColor: { type: String, required: true, trim: true, default: "#18181B" }, // text color
    status: {
      type: String,
      enum: Object.values(BadgeStatus),
      default: BadgeStatus.ACTIVE,
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    deletedReason: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true },
)

export type BadgeDocument = WithId<InferSchemaType<typeof badgeSchema>>
export const BadgeModel = model("Badge", badgeSchema)
