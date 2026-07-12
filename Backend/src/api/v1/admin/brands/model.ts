import { Schema, model, type InferSchemaType } from "mongoose"

import { BrandStatus } from "./enums.js"
import type { WithId } from "../../../../shared/types/mongoose-helpers.js"

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // Server-derived lowercase mirror of `name`, never accepted from a
    // request body — enforces case-insensitive uniqueness on brand name.
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    logo: { type: String },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(BrandStatus),
      default: BrandStatus.ACTIVE,
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

export type BrandDocument = WithId<InferSchemaType<typeof brandSchema>>
export const BrandModel = model("Brand", brandSchema)
