import { Schema, model, type InferSchemaType, type Types } from "mongoose"

const productFaqSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "product_faqs",
  },
)

export type ProductFaqDocument = InferSchemaType<typeof productFaqSchema> & { _id: Types.ObjectId }
export const ProductFaqModel = model("ProductFaq", productFaqSchema)
