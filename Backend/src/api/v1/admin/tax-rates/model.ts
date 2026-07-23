import { Schema, model, type InferSchemaType } from "mongoose"
import type { WithId } from "../../../../shared/types/mongoose-helpers.js"

const taxRateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // lowercase mirror of `name` to ensure case-insensitive uniqueness
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    sgst: { type: Number, required: true, default: 0 },
    cgst: { type: Number, required: true, default: 0 },
    igst: { type: Number, required: true, default: 0 },
    cess: { type: Number, required: true, default: 0 },
    description: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true },
)

export type TaxRateDocument = WithId<InferSchemaType<typeof taxRateSchema>>
export const TaxRateModel = model("TaxRate", taxRateSchema)
