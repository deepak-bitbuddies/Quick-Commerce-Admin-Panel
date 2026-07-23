import { Schema, model, type InferSchemaType, type Types } from "mongoose"

const productReviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    reviewText: {
      type: String,
      trim: true,
      default: "",
    },
    reviewImages: {
      type: [String],
      default: [],
    },
    adminReply: {
      type: String,
      trim: true,
      default: "",
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
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
    collection: "product_reviews",
  },
)

export type ProductReviewDocument = InferSchemaType<typeof productReviewSchema> & { _id: Types.ObjectId }
export const ProductReviewModel = model("ProductReview", productReviewSchema)
