import { Schema, model, type InferSchemaType } from "mongoose"

import type { WithId } from "../../../../shared/types/mongoose-helpers.js"

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export type UserDocument = WithId<InferSchemaType<typeof userSchema>>
export const UserModel = model("User", userSchema)
