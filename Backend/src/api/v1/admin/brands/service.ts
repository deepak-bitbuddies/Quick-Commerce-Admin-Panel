import {
  createBrand,
  findBrandById,
  findBrandByNormalizedName,
  listBrands,
  updateBrand,
  setBrandStatus,
  deleteBrand,
  restoreBrand,
  bulkDeleteBrands,
  bulkStatusUpdateBrands,
  type ListBrandsOptions,
} from "./repository.js"
import type { BrandDocument } from "./model.js"
import { NotFoundError, ConflictError } from "../../../../shared/errors/index.js"
import type { CreateBrandDto, UpdateBrandDto } from "./dto.js"

export async function createBrandRecord(
  input: CreateBrandDto,
  creator?: string,
): Promise<BrandDocument> {
  const normalizedName = input.name.toLowerCase()
  const existing = await findBrandByNormalizedName(normalizedName)
  if (existing) {
    throw new ConflictError("A brand with this name already exists")
  }

  return createBrand({
    name: input.name,
    normalizedName,
    logo: input.logo,
    description: input.description,
    createdBy: creator,
  })
}

export async function getBrands(
  options: ListBrandsOptions,
): Promise<{ brands: BrandDocument[]; total: number }> {
  return listBrands(options)
}

export async function getBrandById(brandId: string): Promise<BrandDocument> {
  const brand = await findBrandById(brandId)
  if (!brand) {
    throw new NotFoundError("Brand not found")
  }
  return brand
}

export async function updateBrandRecord(
  brandId: string,
  input: UpdateBrandDto,
  updater?: string,
): Promise<BrandDocument> {
  const brand = await getBrandById(brandId)

  let normalizedName: string | undefined
  if (input.name) {
    normalizedName = input.name.toLowerCase()
    const existing = await findBrandByNormalizedName(normalizedName)
    if (existing && String(existing._id) !== String(brand._id)) {
      throw new ConflictError("A brand with this name already exists")
    }
  }

  const updated = await updateBrand(brandId, {
    name: input.name,
    normalizedName,
    logo: input.logo,
    description: input.description,
    updatedBy: updater,
  })
  if (!updated) {
    throw new NotFoundError("Brand not found")
  }
  return updated
}

export async function updateBrandActiveStatus(
  brandId: string,
  status: string,
  updatedBy?: string,
): Promise<BrandDocument> {
  const brand = await setBrandStatus(brandId, status, updatedBy)
  if (!brand) {
    throw new NotFoundError("Brand not found")
  }
  return brand
}

export async function deleteBrandRecord(
  brandId: string,
  deleter?: string,
  reason?: string,
): Promise<BrandDocument> {
  await getBrandById(brandId) // Will throw NotFoundError if not found
  const deleted = await deleteBrand(brandId, deleter, reason)
  if (!deleted) {
    throw new NotFoundError("Brand not found")
  }
  return deleted
}

export async function restoreBrandRecord(
  brandId: string,
  updater: string,
): Promise<BrandDocument> {
  const brand = await restoreBrand(brandId, updater)
  if (!brand) {
    throw new NotFoundError("Brand not found")
  }
  return brand
}

export async function executeBulkDeleteBrands(
  ids: string[],
  deletedBy: string,
  reason?: string,
): Promise<void> {
  await bulkDeleteBrands(ids, deletedBy, reason)
}

export async function executeBulkStatusUpdateBrands(
  ids: string[],
  status: string,
  updatedBy: string,
): Promise<void> {
  await bulkStatusUpdateBrands(ids, status, updatedBy)
}
