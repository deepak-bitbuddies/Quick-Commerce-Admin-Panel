export interface Product {
  id: string
  name: string
  price: number
  category: string
}

export interface CreateProductInput {
  name: string
  price: number
  category: string
}
