import { BrandModel, type BrandDocument } from "./model.js"
import { BrandStatus } from "./enums.js"

/** Escapes regex metacharacters so user input can never be interpreted as
 * part of the pattern — mitigates ReDoS from adversarial search strings
 * (Security review finding). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export interface CreateBrandInput {
  name: string
  normalizedName: string
  logo?: string
  description?: string
  createdBy?: string
}

export async function createBrand(
  input: CreateBrandInput,
): Promise<BrandDocument> {
  return BrandModel.create({
    ...input,
    status: BrandStatus.ACTIVE,
    isDeleted: false,
  })
}

export async function findBrandById(
  id: string,
): Promise<BrandDocument | null> {
  return BrandModel.findOne({ _id: id, isDeleted: { $ne: true } }).lean()
}

export async function findBrandByNormalizedName(
  normalizedName: string,
): Promise<BrandDocument | null> {
  return BrandModel.findOne({ normalizedName, isDeleted: { $ne: true } }).lean()
}

export interface ListBrandsOptions {
  search?: string
  status?: string
  deleted?: boolean
  page?: number
  pageSize?: number
}

export async function listBrands(
  options: ListBrandsOptions = {},
): Promise<{ brands: BrandDocument[]; total: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const filter: Record<string, unknown> = options.deleted
    ? { isDeleted: true }
    : { isDeleted: { $ne: true } }

  if (options.status) {
    filter.status = options.status.toUpperCase()
  }
  if (options.search) {
    filter.name = { $regex: escapeRegExp(options.search), $options: "i" }
  }

  const [brands, total] = await Promise.all([
    BrandModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    BrandModel.countDocuments(filter),
  ])

  return { brands, total }
}

export interface UpdateBrandInput {
  name?: string
  normalizedName?: string
  logo?: string | null
  description?: string | null
  updatedBy?: string
}

export async function updateBrand(
  id: string,
  input: UpdateBrandInput,
): Promise<BrandDocument | null> {
  const set: Record<string, unknown> = {}
  const unset: Record<string, ""> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (value === null) {
      unset[key] = ""
    } else {
      set[key] = value
    }
  }

  const update: Record<string, unknown> = {}
  if (Object.keys(set).length > 0) update.$set = set
  if (Object.keys(unset).length > 0) update.$unset = unset

  return BrandModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    update,
    { new: true },
  ).lean()
}

export async function setBrandStatus(
  id: string,
  status: string,
  updatedBy?: string,
): Promise<BrandDocument | null> {
  return BrandModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { $set: { status: status.toUpperCase(), updatedBy } },
    { new: true },
  ).lean()
}

export async function deleteBrand(
  id: string,
  deleter?: string,
  reason?: string,
): Promise<BrandDocument | null> {
  return BrandModel.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deleter || null,
        deletedReason: reason || null,
      },
    },
    { new: true },
  ).lean()
}

export async function restoreBrand(
  id: string,
  updater: string,
): Promise<BrandDocument | null> {
  return BrandModel.findOneAndUpdate(
    { _id: id, isDeleted: true },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
        updatedBy: updater,
      },
    },
    { new: true },
  ).lean()
}

export async function bulkDeleteBrands(
  ids: string[],
  deletedBy: string,
  reason?: string,
): Promise<void> {
  await BrandModel.updateMany(
    { _id: { $in: ids }, isDeleted: { $ne: true } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        deletedReason: reason || null,
      },
    },
  )
}

export async function bulkStatusUpdateBrands(
  ids: string[],
  status: string,
  updatedBy: string,
): Promise<void> {
  await BrandModel.updateMany(
    { _id: { $in: ids }, isDeleted: { $ne: true } },
    {
      $set: {
        status: status.toUpperCase(),
        updatedBy,
      },
    },
  )
}
