import { BrandModel, type BrandDocument } from "./model.js"
import type { BrandStatus } from "./enums.js"

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
}

export async function createBrand(
  input: CreateBrandInput,
): Promise<BrandDocument> {
  return BrandModel.create(input)
}

export async function findBrandById(
  id: string,
): Promise<BrandDocument | null> {
  return BrandModel.findById(id).lean()
}

export async function findBrandByNormalizedName(
  normalizedName: string,
): Promise<BrandDocument | null> {
  return BrandModel.findOne({ normalizedName }).lean()
}

export interface ListBrandsOptions {
  search?: string
  status?: BrandStatus
  page?: number
  pageSize?: number
}

export async function listBrands(
  options: ListBrandsOptions = {},
): Promise<{ brands: BrandDocument[]; total: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const filter: Record<string, unknown> = {}

  if (options.status) {
    filter.status = options.status
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
  // `null` means "clear this field"; `undefined` (key omitted) means "leave
  // it alone" — collapsing both to $set would silently no-op a clear
  // (Code Review finding), so they're routed to $set vs. $unset below.
  logo?: string | null
  description?: string | null
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

  return BrandModel.findByIdAndUpdate(id, update, { new: true }).lean()
}

export async function setBrandStatus(
  id: string,
  status: BrandStatus,
): Promise<BrandDocument | null> {
  return BrandModel.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true },
  ).lean()
}
