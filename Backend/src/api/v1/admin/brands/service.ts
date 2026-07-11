import {
  createBrand,
  findBrandById,
  findBrandByNormalizedName,
  listBrands,
  updateBrand,
  setBrandStatus,
  type ListBrandsOptions,
} from "./repository.js"
import type { BrandDocument } from "./model.js"
import type { BrandStatus } from "./enums.js"
import { NotFoundError, ConflictError } from "../../../../shared/errors/index.js"
import type { CreateBrandDto, UpdateBrandDto } from "./dto.js"

export async function createBrandRecord(
  input: CreateBrandDto,
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
  })
  if (!updated) {
    throw new NotFoundError("Brand not found")
  }
  return updated
}

export async function updateBrandActiveStatus(
  brandId: string,
  status: BrandStatus,
): Promise<BrandDocument> {
  const brand = await setBrandStatus(brandId, status)
  if (!brand) {
    throw new NotFoundError("Brand not found")
  }
  return brand
}
