import { api } from "@/lib/axios"
import type { CreateProductInput, Product } from "../types/product"

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/products")
  return data
}

export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  const { data } = await api.post<Product>("/products", input)
  return data
}
