import { connectDatabase, disconnectDatabase } from "../core/database/db.js"
import { ProductModel, VariantModel } from "../api/v1/admin/products/model.js"
import { CatalogNodeModel } from "../api/v1/admin/categories/model.js"
import { BrandModel } from "../api/v1/admin/brands/model.js"
import { TaxRateModel } from "../api/v1/admin/tax-rates/model.js"
import { ProductStatus, VariantStatus, ProductType, ProductAvailability } from "../api/v1/admin/products/enums.js"
import { CatalogNodeType, CatalogNodeStatus } from "../api/v1/admin/categories/enums.js"
import { BrandStatus } from "../api/v1/admin/brands/enums.js"
import { logger } from "../core/logger/logger.js"
import { randomUUID } from "crypto"

async function main(): Promise<void> {
  logger.info("[seeder] Connecting to database...")
  await connectDatabase()

  // 1. Delete all existing data
  logger.info("[seeder] Cleaning up existing catalog and tax data...")
  await ProductModel.deleteMany({})
  await VariantModel.deleteMany({})
  await CatalogNodeModel.deleteMany({})
  await TaxRateModel.deleteMany({})
  await BrandModel.deleteMany({})
  logger.info("[seeder] Cleanup complete.")

  // 2. Seed Tax Rates
  logger.info("[seeder] Seeding Tax Rates...")
  const taxRatesData = [
    { name: "GST 0%", sgst: 0, cgst: 0, igst: 0, cess: 0, description: "Zero tax items (Milk, Fresh Vegetables, Bread)" },
    { name: "GST 5%", sgst: 2.5, cgst: 2.5, igst: 5, cess: 0, description: "Packed food items, tea, coffee, spices" },
    { name: "GST 12%", sgst: 6, cgst: 6, igst: 12, cess: 0, description: "Butter, Cheese, dry fruits" },
    { name: "GST 18%", sgst: 9, cgst: 9, igst: 18, cess: 0, description: "Standard personal care, snacks, detergents" },
    { name: "GST 28%", sgst: 14, cgst: 14, igst: 28, cess: 0, description: "Carbonated sodas, luxury items" }
  ]

  const seededTaxRates: Record<string, any> = {}
  for (const tax of taxRatesData) {
    const normalizedName = tax.name.trim().toLowerCase()
    const rate = await TaxRateModel.create({
      ...tax,
      normalizedName,
      createdBy: "seeder",
      updatedBy: "seeder"
    })
    seededTaxRates[tax.name] = rate
    logger.info(`[seeder] Created Tax Rate: ${tax.name}`)
  }

  // 3. Seed Brands
  logger.info("[seeder] Seeding Brands...")
  const brandsData = [
    { name: "Amul", description: "The Taste of India - Milk and Dairy items" },
    { name: "Balaji", description: "Balaji Wafers and Namkeens" },
    { name: "Parachute", description: "Pure coconut hair oil by Marico" },
    { name: "Ponds", description: "Ponds Skin Care & Talcum Powders" },
    { name: "Nivea", description: "Nivea skin creams and body lotions" },
    { name: "Nescafe", description: "Nescafe Instant Coffee" },
    { name: "Coca-Cola", description: "Coca-Cola beverages" },
    { name: "Aashirvaad", description: "Aashirvaad Atta and Staples by ITC" },
    { name: "Tata", description: "Tata Dals, Pulses, and Salts" },
    { name: "Britannia", description: "Britannia Bread, Cakes, and Biscuits" },
    { name: "Cadbury", description: "Cadbury Chocolates" },
    { name: "Pampers", description: "Pampers Baby Diapers and Wipes" },
    { name: "Surf Excel", description: "Surf Excel Detergent Powders and Liquids" },
    { name: "Vim", description: "Vim Dishwashing Bars and Liquids" },
    { name: "Fresh Produce", description: "Fresh farm-sourced fruits and vegetables" }
  ]

  const seededBrands: Record<string, any> = {}
  for (const b of brandsData) {
    const normalizedName = b.name.trim().toLowerCase()
    const brand = await BrandModel.create({
      name: b.name,
      normalizedName,
      description: b.description,
      status: BrandStatus.ACTIVE,
      createdBy: "seeder",
      updatedBy: "seeder"
    })
    seededBrands[b.name] = brand
    logger.info(`[seeder] Created Brand: ${b.name}`)
  }

  // 4. Seed Categories and Subcategories
  logger.info("[seeder] Seeding Categories & Subcategories...")
  const categoriesData = [
    {
      code: "DAIRY_BREAKFAST",
      name: "Dairy & Breakfast",
      description: "Milk, Butter, Curd, Cheese, Eggs, and Bread",
      thumbnail: "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "MILK_BUTTER",
        name: "Milk & Butter",
        description: "Fresh farm milk, table butter, and spreads",
        thumbnail: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "SNACKS_MUNCHIES",
      name: "Snacks & Munchies",
      description: "Chips, Crisps, Kurkure, Namkeens, and Biscuits",
      thumbnail: "https://images.unsplash.com/photo-1621939514649-280e2ee37f6a?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "CHIPS_NAMKEEN",
        name: "Chips & Namkeen",
        description: "Potato wafers, traditional namkeen, and crunchy kurkure",
        thumbnail: "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "PERSONAL_CARE",
      name: "Personal Care & Hygiene",
      description: "Hair care, skin care, creams, talc, and wellness",
      thumbnail: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "SKIN_HAIR_CARE",
        name: "Skin & Hair Care",
        description: "Coconut oil, talcum powder, face creams, and face wash",
        thumbnail: "https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "BEVERAGES",
      name: "Beverages",
      description: "Soft drinks, cold drinks, tea, coffee, and juices",
      thumbnail: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "TEA_COFFEE_SODAS",
        name: "Tea, Coffee & Sodas",
        description: "Instant coffee, tea dust, and fizzy soft drinks",
        thumbnail: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "STAPLES_GROCERY",
      name: "Staples & Grocery",
      description: "Atta, Rice, Dals, Pulses, Ghee, and Spices",
      thumbnail: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "ATTA_RICE_DALS",
        name: "Atta, Rice & Dals",
        description: "Shudh chakki wheat flour, basmati rice, and quality dals",
        thumbnail: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "BAKERY_BREAD",
      name: "Bakery & Bread",
      description: "Fresh sandwich bread, buns, pav, and gourmet cookies",
      thumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "BREADS_COOKIES",
        name: "Breads & Cookies",
        description: "White bread, brown bread, sweet cookies, and rusk",
        thumbnail: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "CHOCOLATES_ICE_CREAMS",
      name: "Chocolates & Ice Creams",
      description: "Milk chocolate, dark chocolate, and ice cream tubs",
      thumbnail: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "CHOCO_SWEETS",
        name: "Chocolates & Sweets",
        description: "Premium chocolates, sweet candies, and bars",
        thumbnail: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "BABY_CARE",
      name: "Baby Care",
      description: "Diapers, wipes, baby food, and baby hygiene",
      thumbnail: "https://images.unsplash.com/photo-1515488042361-404e9250afef?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "BABY_HYGIENE",
        name: "Baby Hygiene",
        description: "Ultra gentle baby wipes, talc, and soaps",
        thumbnail: "https://images.unsplash.com/photo-1515488042361-404e9250afef?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "HOME_HOUSEHOLD",
      name: "Home & Household",
      description: "Laundry detergents, dishwash bars, and surface cleaners",
      thumbnail: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "DETERGENTS_CLEANERS",
        name: "Detergents & Cleaners",
        description: "Washing powders, liquid dishwashers, and cleaning aids",
        thumbnail: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop&q=60"
      }
    },
    {
      code: "FRUITS_VEGETABLES",
      name: "Fruits & Vegetables",
      description: "Fresh farm vegetables and seasonal fresh fruits",
      thumbnail: "https://images.unsplash.com/photo-1610348725511-27a812cf20e1?w=500&auto=format&fit=crop&q=60",
      subcategory: {
        code: "FRESH_VEGETABLES",
        name: "Fresh Vegetables",
        description: "Daily essentials: potatoes, onions, tomatoes, and greens",
        thumbnail: "https://images.unsplash.com/photo-1518843875459-f738682238a6?w=500&auto=format&fit=crop&q=60"
      }
    }
  ]

  // Map subcategory code to its parent category object and the subcategory model instance
  const leafCategories: Record<string, any> = {}

  for (const cat of categoriesData) {
    // 1. Create Parent Category (level 0, parentId null, path /_id, isLeaf false)
    const parentId = randomUUID()
    const parentSlug = cat.name.toLowerCase().trim().replace(/[\s&]+/g, "-").replace(/-+/g, "-")
    await CatalogNodeModel.create({
      _id: parentId,
      code: cat.code,
      name: cat.name,
      normalizedName: cat.name.trim().toLowerCase(),
      slug: parentSlug,
      type: CatalogNodeType.NORMAL,
      parentId: null,
      level: 0,
      path: `/${parentId}`,
      isLeaf: false,
      childCount: 1,
      productCount: 0,
      description: cat.description,
      thumbnail: cat.thumbnail,
      status: CatalogNodeStatus.ACTIVE,
      showInMenu: true,
      showOnHome: true,
      createdBy: "seeder",
      updatedBy: "seeder"
    })
    logger.info(`[seeder] Created Parent Category: ${cat.name}`)

    // 2. Create Subcategory (level 1, parentId parentId, path /parentId/subId, isLeaf true)
    const subId = randomUUID()
    const subSlug = cat.subcategory.name.toLowerCase().trim().replace(/[\s&]+/g, "-").replace(/-+/g, "-")
    const subNode = await CatalogNodeModel.create({
      _id: subId,
      code: cat.subcategory.code,
      name: cat.subcategory.name,
      normalizedName: cat.subcategory.name.trim().toLowerCase(),
      slug: subSlug,
      type: CatalogNodeType.NORMAL,
      parentId: parentId,
      level: 1,
      path: `/${parentId}/${subId}`,
      isLeaf: true,
      childCount: 0,
      productCount: 0,
      description: cat.subcategory.description,
      thumbnail: cat.subcategory.thumbnail,
      status: CatalogNodeStatus.ACTIVE,
      showInMenu: true,
      showOnHome: true,
      createdBy: "seeder",
      updatedBy: "seeder"
    })
    logger.info(`[seeder] Created Subcategory: ${cat.subcategory.name} (Parent: ${cat.name})`)

    leafCategories[cat.subcategory.code] = subNode
  }

  // Helper function to seed product and its variants
  async function seedProduct(payload: {
    name: string
    description: string
    subcategoryCode: string
    brandName: string
    taxName: string
    hsnCode: string
    images: string[]
    variants: Array<{
      sku: string
            size: string
      weightInGrams: number
      mrp: number
      rateA: number
      stock: number
    }>
  }) {
    const subCategory = leafCategories[payload.subcategoryCode]
    if (!subCategory) {
      throw new Error(`Subcategory code ${payload.subcategoryCode} not found in map`)
    }
    const brand = seededBrands[payload.brandName]
    if (!brand) {
      throw new Error(`Brand ${payload.brandName} not found in map`)
    }
    const taxRate = seededTaxRates[payload.taxName]
    if (!taxRate) {
      throw new Error(`Tax rate ${payload.taxName} not found in map`)
    }

    // Create the Product document
    const product = await ProductModel.create({
      productType: ProductType.SIMPLE,
      name: payload.name,
      normalizedName: payload.name.trim().toLowerCase(),
      description: payload.description,
      categoryId: subCategory._id,
      brandId: brand._id,
      taxId: taxRate._id,
      primaryImage: payload.images[0] || undefined,
      galleryImages: payload.images,
      tags: [payload.name.trim().toLowerCase()],
      seo: {
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        metaTitle: payload.name,
        metaDescription: payload.description,
        keywords: [payload.name.toLowerCase()]
      },
      sortOrder: 0,
      availability: ProductAvailability.IN_STOCK,
      status: ProductStatus.ACTIVE,
      createdBy: "seeder",
      updatedBy: "seeder"
    })

    logger.info(`[seeder] Created Product: ${product.name}`)

    // Create Product Variants
    const variantsToCreate = payload.variants.map((v) => {
      const sizeLower = v.size.toLowerCase()
      let unit: "gm" | "kg" | "litre" | "ml" | "pcs" = "pcs"
      if (sizeLower.includes("ml")) unit = "ml"
      else if (sizeLower.includes("kg")) unit = "kg"
      else if (sizeLower.includes("gm") || sizeLower.includes("g")) unit = "gm"
      else if (sizeLower.includes("litre") || sizeLower.includes("l")) unit = "litre"

      const unitValueMatch = v.size.match(/\d+/)
      const unitValue = unitValueMatch ? parseInt(unitValueMatch[0], 10) : 1

      return {
        productId: product._id,
        name: v.size,
        unit,
        unitValue,
        sku: v.sku.toUpperCase(),
                mrp: v.mrp,
        sellingPrice: v.rateA,
        offerPrice: null,
        costPrice: Math.round(v.rateA * 0.80),
        primaryImage: payload.images[0] || undefined,
        galleryImages: payload.images,
        inventory: {
          availableStock: v.stock,
          appStock: v.stock,
          localStock: v.stock,
          minStock: 1,
          reorderLevel: Math.round(v.stock * 0.3) || 10,
        },
        sortOrder: 0,
        isDefault: false,
        availability: ProductAvailability.IN_STOCK,
        status: VariantStatus.ACTIVE,
        createdBy: "seeder",
        updatedBy: "seeder"
      }
    })

    await VariantModel.create(variantsToCreate)
    logger.info(`[seeder] Seeded ${variantsToCreate.length} variants for ${product.name}`)

    // Update product counts on categories
    await CatalogNodeModel.updateOne({ _id: subCategory._id }, { $inc: { productCount: 1 } })
    if (subCategory.parentId) {
      await CatalogNodeModel.updateOne({ _id: subCategory.parentId }, { $inc: { productCount: 1 } })
    }
  }

  // 5. Seed Products with Variants
  logger.info("[seeder] Seeding products & variants under subcategories...")

  // Product 1: Amul Gold Milk (under Milk & Butter)
  await seedProduct({
    name: "Amul Gold Milk",
    description: "Pasteurized cream milk, fresh and rich in taste. Essential for your daily tea, coffee, and breakfast.",
    subcategoryCode: "MILK_BUTTER",
    brandName: "Amul",
    taxName: "GST 0%",
    hsnCode: "04012000",
    images: ["https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "AMUL-GOLD-500ML", size: "500 ml", weightInGrams: 510, mrp: 3300, rateA: 3200, stock: 150 },
      { sku: "AMUL-GOLD-1LTR", size: "1 Litre", weightInGrams: 1020, mrp: 6600, rateA: 6400, stock: 100 }
    ]
  })

  // Product 2: Amul Butter (under Milk & Butter)
  await seedProduct({
    name: "Amul Butter",
    description: "Utterly Butterly Delicious table butter from Amul. Perfectly compliments bread, toasts, parathas and more.",
    subcategoryCode: "MILK_BUTTER",
    brandName: "Amul",
    taxName: "GST 12%",
    hsnCode: "04051000",
    images: ["https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "AMUL-BUTTER-100G", size: "100 g", weightInGrams: 105, mrp: 5800, rateA: 5600, stock: 200 },
      { sku: "AMUL-BUTTER-500G", size: "500 g", weightInGrams: 515, mrp: 27500, rateA: 26500, stock: 80 }
    ]
  })

  // Product 3: Balaji Kurkure Masala Munch (under Chips & Namkeen)
  await seedProduct({
    name: "Balaji Kurkure Masala Munch",
    description: "Spicy and crunchy puffed corn snacks seasoned with Indian spices. Perfectly goes with tea or as an evening snack.",
    subcategoryCode: "CHIPS_NAMKEEN",
    brandName: "Balaji",
    taxName: "GST 18%",
    hsnCode: "19059030",
    images: ["https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "BALAJI-KURK-90G", size: "90 g", weightInGrams: 95, mrp: 2000, rateA: 1800, stock: 300 },
      { sku: "BALAJI-KURK-180G", size: "180 g", weightInGrams: 188, mrp: 4000, rateA: 3600, stock: 200 }
    ]
  })

  // Product 4: Balaji Wafers Simply Salted (under Chips & Namkeen)
  await seedProduct({
    name: "Balaji Wafers Simply Salted",
    description: "Crispy and light golden potato wafers seasoned with simple sea salt. Classic and delicious.",
    subcategoryCode: "CHIPS_NAMKEEN",
    brandName: "Balaji",
    taxName: "GST 18%",
    hsnCode: "20052000",
    images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "BALAJI-WAF-80G", size: "80 g", weightInGrams: 85, mrp: 2000, rateA: 1900, stock: 250 },
      { sku: "BALAJI-WAF-150G", size: "150 g", weightInGrams: 156, mrp: 5000, rateA: 4500, stock: 150 }
    ]
  })

  // Product 5: Parachute Coconut Hair Oil (under Skin & Hair Care)
  await seedProduct({
    name: "Parachute Coconut Hair Oil",
    description: "100% pure coconut hair oil sourced from premium quality sundried coconuts. Nourishes hair from within.",
    subcategoryCode: "SKIN_HAIR_CARE",
    brandName: "Parachute",
    taxName: "GST 18%",
    hsnCode: "33051090",
    images: ["https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "PARA-OIL-175ML", size: "175 ml", weightInGrams: 180, mrp: 9900, rateA: 9500, stock: 100 },
      { sku: "PARA-OIL-500ML", size: "500 ml", weightInGrams: 510, mrp: 28000, rateA: 26500, stock: 60 }
    ]
  })

  // Product 6: Ponds Dreamflower Talcum Powder (under Skin & Hair Care)
  await seedProduct({
    name: "Ponds Dreamflower Talcum Powder",
    description: "Fragrant talcum powder that keeps you fresh and glowing all day. Protects against sweat and body odor.",
    subcategoryCode: "SKIN_HAIR_CARE",
    brandName: "Ponds",
    taxName: "GST 18%",
    hsnCode: "33049100",
    images: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "PONDS-TALC-100G", size: "100 g", weightInGrams: 115, mrp: 11000, rateA: 10500, stock: 90 },
      { sku: "PONDS-TALC-250G", size: "250 g", weightInGrams: 275, mrp: 26000, rateA: 24500, stock: 50 }
    ]
  })

  // Product 7: Nivea Soft Light Cream (under Skin & Hair Care)
  await seedProduct({
    name: "Nivea Soft Light Cream",
    description: "Highly effective, fast-absorbing moisturizing cream containing Jojoba Oil and Vitamin E. For refreshingly soft skin.",
    subcategoryCode: "SKIN_HAIR_CARE",
    brandName: "Nivea",
    taxName: "GST 18%",
    hsnCode: "33049910",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "NIVEA-CREAM-50ML", size: "50 ml", weightInGrams: 62, mrp: 10000, rateA: 9500, stock: 120 },
      { sku: "NIVEA-CREAM-200ML", size: "200 ml", weightInGrams: 220, mrp: 32500, rateA: 31000, stock: 70 }
    ]
  })

  // Product 8: Nescafe Classic Coffee (under Tea, Coffee & Sodas)
  await seedProduct({
    name: "Nescafe Classic Coffee",
    description: "100% pure instant coffee granules. Start your morning with the rich, bold taste of classic Nescafe.",
    subcategoryCode: "TEA_COFFEE_SODAS",
    brandName: "Nescafe",
    taxName: "GST 18%",
    hsnCode: "21011110",
    images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "NESCAFE-COFFEE-50G", size: "50 g", weightInGrams: 65, mrp: 18500, rateA: 17500, stock: 80 },
      { sku: "NESCAFE-COFFEE-100G", size: "100 g", weightInGrams: 125, mrp: 36000, rateA: 34000, stock: 60 }
    ]
  })

  // Product 9: Coca-Cola Soft Drink (under Tea, Coffee & Sodas)
  await seedProduct({
    name: "Coca-Cola Soft Drink",
    description: "Crisp and refreshing carbonated soft drink. Perfectly pairs with hot meals or as a party refresher.",
    subcategoryCode: "TEA_COFFEE_SODAS",
    brandName: "Coca-Cola",
    taxName: "GST 28%",
    hsnCode: "22021010",
    images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "COKE-CAN-250ML", size: "250 ml Can", weightInGrams: 265, mrp: 4000, rateA: 3800, stock: 200 },
      { sku: "COKE-BOT-1.25L", size: "1.25 Litre", weightInGrams: 1300, mrp: 7000, rateA: 6500, stock: 120 }
    ]
  })

  // Product 10: Aashirvaad Shudh Chakki Atta (under Atta, Rice & Dals)
  await seedProduct({
    name: "Aashirvaad Shudh Chakki Atta",
    description: "100% pure whole wheat flour processed with traditional chakki grinding. Yields soft and healthy rotis.",
    subcategoryCode: "ATTA_RICE_DALS",
    brandName: "Aashirvaad",
    taxName: "GST 0%",
    hsnCode: "11010000",
    images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "AASH-ATTA-5KG", size: "5 kg", weightInGrams: 5050, mrp: 29000, rateA: 27500, stock: 100 },
      { sku: "AASH-ATTA-10KG", size: "10 kg", weightInGrams: 10100, mrp: 56000, rateA: 53000, stock: 60 }
    ]
  })

  // Product 11: Tata Sampann Toor Dal (under Atta, Rice & Dals)
  await seedProduct({
    name: "Tata Sampann Unpolished Toor Dal",
    description: "Premium unpolished pigeon peas (arhar dal). Naturally nutritious, rich in protein, and easy to cook.",
    subcategoryCode: "ATTA_RICE_DALS",
    brandName: "Tata",
    taxName: "GST 0%",
    hsnCode: "07133100",
    images: ["https://images.unsplash.com/photo-1585994187746-e4a770910925?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "TATA-TDAL-1KG", size: "1 kg", weightInGrams: 1010, mrp: 22000, rateA: 21000, stock: 120 }
    ]
  })

  // Product 12: Britannia Premium Sandwich Bread (under Breads & Cookies)
  await seedProduct({
    name: "Britannia Premium Sandwich Bread",
    description: "Soft and fresh white sandwich bread baked to perfection. Perfect for daily sandwiches and toasts.",
    subcategoryCode: "BREADS_COOKIES",
    brandName: "Britannia",
    taxName: "GST 0%",
    hsnCode: "19059010",
    images: ["https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "BRIT-BREAD-400G", size: "400 g", weightInGrams: 405, mrp: 3000, rateA: 2800, stock: 150 }
    ]
  })

  // Product 13: Britannia Good Day Cashew Cookies (under Breads & Cookies)
  await seedProduct({
    name: "Britannia Good Day Cashew Cookies",
    description: "Buttery biscuits loaded with real cashew bits. Bring a smile to your face with every bite.",
    subcategoryCode: "BREADS_COOKIES",
    brandName: "Britannia",
    taxName: "GST 18%",
    hsnCode: "19053100",
    images: ["https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "BRIT-GD-100G", size: "100 g", weightInGrams: 105, mrp: 3000, rateA: 2800, stock: 180 }
    ]
  })

  // Product 14: Cadbury Dairy Milk Silk (under Chocolates & Sweets)
  await seedProduct({
    name: "Cadbury Dairy Milk Silk Chocolate",
    description: "Premium smooth milk chocolate that melts in your mouth. Indulge in the richer, smoother chocolate experience.",
    subcategoryCode: "CHOCO_SWEETS",
    brandName: "Cadbury",
    taxName: "GST 18%",
    hsnCode: "18063100",
    images: ["https://images.unsplash.com/photo-1548907040-4d42b52125e0?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "CADBURY-SILK-60G", size: "60 g", weightInGrams: 63, mrp: 8000, rateA: 7500, stock: 150 },
      { sku: "CADBURY-SILK-150G", size: "150 g", weightInGrams: 155, mrp: 19000, rateA: 18000, stock: 80 }
    ]
  })

  // Product 15: Pampers Baby Gentle Wipes (under Baby Hygiene)
  await seedProduct({
    name: "Pampers Baby Gentle Wipes",
    description: "Alcohol-free, pH-balanced baby wipes infused with Aloe Vera. Extremely gentle on baby's sensitive skin.",
    subcategoryCode: "BABY_HYGIENE",
    brandName: "Pampers",
    taxName: "GST 18%",
    hsnCode: "56031200",
    images: ["https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "PAMPERS-WIPES-80", size: "80 Wipes", weightInGrams: 280, mrp: 19900, rateA: 18500, stock: 100 }
    ]
  })

  // Product 16: Surf Excel Easy Wash (under Detergents & Cleaners)
  await seedProduct({
    name: "Surf Excel Easy Wash Detergent",
    description: "Premium laundry powder that removes tough stains easily in buckets. Safe on hands and preserves clothes' color.",
    subcategoryCode: "DETERGENTS_CLEANERS",
    brandName: "Surf Excel",
    taxName: "GST 18%",
    hsnCode: "34022020",
    images: ["https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "SURF-EASY-1KG", size: "1 kg", weightInGrams: 1020, mrp: 17000, rateA: 16000, stock: 120 },
      { sku: "SURF-EASY-3KG", size: "3 kg", weightInGrams: 3040, mrp: 49000, rateA: 46000, stock: 50 }
    ]
  })

  // Product 17: Vim Dishwash Liquid Gel (under Detergents & Cleaners)
  await seedProduct({
    name: "Vim Lemon Dishwash Gel",
    description: "Liquid dishwashing gel infused with the power of 100 lemons. Leaves dishes sparkling clean and grease-free.",
    subcategoryCode: "DETERGENTS_CLEANERS",
    brandName: "Vim",
    taxName: "GST 18%",
    hsnCode: "34022090",
    images: ["https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "VIM-GEL-250ML", size: "250 ml", weightInGrams: 275, mrp: 6000, rateA: 5500, stock: 150 },
      { sku: "VIM-GEL-750ML", size: "750 ml", weightInGrams: 785, mrp: 17500, rateA: 16500, stock: 80 }
    ]
  })

  // Product 18: Fresh Potato (under Fresh Vegetables)
  await seedProduct({
    name: "Fresh Potato (Aloo)",
    description: "Premium farm-fresh potatoes. Essential vegetable for every kitchen, perfect for curries, fries, and baking.",
    subcategoryCode: "FRESH_VEGETABLES",
    brandName: "Fresh Produce",
    taxName: "GST 0%",
    hsnCode: "07019000",
    images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "FRESH-POTATO-1KG", size: "1 kg", weightInGrams: 1000, mrp: 4000, rateA: 3500, stock: 250 },
      { sku: "FRESH-POTATO-2KG", size: "2 kg", weightInGrams: 2000, mrp: 7500, rateA: 6800, stock: 150 }
    ]
  })

  // Product 19: Fresh Onion (Pyaj) (under Fresh Vegetables)
  await seedProduct({
    name: "Fresh Onion (Pyaj)",
    description: "Direct-from-farm red onions. Offers sharp flavor and crisp texture, an indispensable kitchen staple.",
    subcategoryCode: "FRESH_VEGETABLES",
    brandName: "Fresh Produce",
    taxName: "GST 0%",
    hsnCode: "07031010",
    images: ["https://images.unsplash.com/photo-1508747703725-719ae257c26a?w=500&auto=format&fit=crop&q=60"],
    variants: [
      { sku: "FRESH-ONION-1KG", size: "1 kg", weightInGrams: 1000, mrp: 5000, rateA: 4500, stock: 200 }
    ]
  })

  logger.info("[seeder] Catalog and tax rate seeding completed successfully!")
  await disconnectDatabase()
}

main().catch((err: unknown) => {
  logger.error({ err }, "[seeder] Seeder failed")
  process.exit(1)
})
