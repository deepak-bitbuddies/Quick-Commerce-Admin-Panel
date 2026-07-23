import { Types } from "mongoose"

import { TaxRateModel, type TaxRateDocument } from "./model.js"
import { NotFoundError, ConflictError } from "../../../../shared/errors/index.js"

export async function createTaxRate(
  input: { name: string; sgst: number; cgst: number; igst: number; cess?: number; description?: string },
  creator?: string,
): Promise<TaxRateDocument> {
  const normalizedName = input.name.toLowerCase().trim()
  const existing = await TaxRateModel.findOne({ normalizedName, isDeleted: false })
  if (existing) {
    throw new ConflictError("A tax rate with this name already exists")
  }

  const taxRate = new TaxRateModel({
    name: input.name.trim(),
    normalizedName,
    sgst: input.sgst,
    cgst: input.cgst,
    igst: input.igst,
    cess: input.cess ?? 0,
    description: input.description,
    createdBy: creator,
    updatedBy: creator,
  })

  return (await taxRate.save()) as any
}

export async function listTaxRates(options: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ nodes: TaxRateDocument[]; total: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  const skip = (page - 1) * pageSize

  const query: any = { isDeleted: false }
  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    query.name = { $regex: escaped, $options: "i" }
  }

  const [nodes, total] = await Promise.all([
    TaxRateModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    TaxRateModel.countDocuments(query).exec(),
  ])

  return { nodes: nodes as any[], total }
}

export async function getTaxRateById(id: string): Promise<TaxRateDocument> {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundError("Invalid tax rate ID format")
  }
  const taxRate = await TaxRateModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false })
  if (!taxRate) {
    throw new NotFoundError("Tax rate not found")
  }
  return taxRate as any
}

export async function updateTaxRate(
  id: string,
  input: { name?: string; sgst?: number; cgst?: number; igst?: number; cess?: number; description?: string | null },
  updater?: string,
): Promise<TaxRateDocument> {
  const taxRate = await getTaxRateById(id)

  const updateData: any = { updatedBy: updater }

  if (input.name !== undefined) {
    const normalizedName = input.name.toLowerCase().trim()
    const existing = await TaxRateModel.findOne({
      normalizedName,
      isDeleted: false,
      _id: { $ne: taxRate._id },
    })
    if (existing) {
      throw new ConflictError("A tax rate with this name already exists")
    }
    updateData.name = input.name.trim()
    updateData.normalizedName = normalizedName
  }

  if (input.sgst !== undefined) updateData.sgst = input.sgst
  if (input.cgst !== undefined) updateData.cgst = input.cgst
  if (input.igst !== undefined) updateData.igst = input.igst
  if (input.cess !== undefined) updateData.cess = input.cess
  if (input.description !== undefined) {
    updateData.description = input.description === null ? null : input.description.trim()
  }

  const updated = await TaxRateModel.findOneAndUpdate(
    { _id: taxRate._id, isDeleted: false },
    { $set: updateData },
    { new: true },
  ).exec()

  if (!updated) {
    throw new NotFoundError("Tax rate not found")
  }
  return updated as any
}

export async function deleteTaxRate(id: string, deleter?: string): Promise<void> {
  const taxRate = await getTaxRateById(id)

  await TaxRateModel.updateOne(
    { _id: taxRate._id },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deleter,
      },
    },
  ).exec()
}
