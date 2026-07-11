"use client"

import { useFormatter, useTranslations } from "next-intl"
import {
  ArrowClockwiseIcon,
  DotsThreeIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PowerIcon,
  StorefrontIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ApiErrorPayload } from "@/lib/axios"
import type { Brand } from "../types/brand"

const SKELETON_ROW_COUNT = 8

interface BrandsTableProps {
  brands: Brand[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: ApiErrorPayload | null
  onRetry: () => void
  pageSize: number
  hasActiveFilters: boolean
  onClearFilters: () => void
  onCreateClick: () => void
  onEditBrand: (brand: Brand) => void
  onToggleStatus: (brand: Brand) => void
}

function BrandLogo({ brand }: { brand: Brand }) {
  if (brand.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logo}
        alt=""
        className="size-8 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
      />
    )
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <StorefrontIcon className="size-4" />
    </span>
  )
}

function BrandStatusBadge({ brand }: { brand: Brand }) {
  const t = useTranslations("Brands")
  return (
    <Badge variant={brand.status === "active" ? "default" : "secondary"}>
      {brand.status === "active" ? t("statusActive") : t("statusInactive")}
    </Badge>
  )
}

function BrandRowActions({
  brand,
  onEditBrand,
  onToggleStatus,
}: {
  brand: Brand
  onEditBrand: (brand: Brand) => void
  onToggleStatus: (brand: Brand) => void
}) {
  const t = useTranslations("Brands")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <DotsThreeIcon weight="bold" />
            <span className="sr-only">
              {t("rowActionsLabel", { name: brand.name })}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEditBrand(brand)}>
          <PencilSimpleIcon />
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleStatus(brand)}>
          <PowerIcon />
          {brand.status === "active" ? t("deactivate") : t("activate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BrandsTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-4xl" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto size-7 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function BrandsTable({
  brands,
  isLoading,
  isFetching,
  isError,
  error,
  onRetry,
  pageSize,
  hasActiveFilters,
  onClearFilters,
  onCreateClick,
  onEditBrand,
  onToggleStatus,
}: BrandsTableProps) {
  const t = useTranslations("Brands")
  const format = useFormatter()

  const skeletonRowCount = Math.min(pageSize, SKELETON_ROW_COUNT)

  const columnCount = 5

  let bodyContent: React.ReactNode

  if (isLoading) {
    bodyContent = <BrandsTableSkeleton rowCount={skeletonRowCount} />
  } else if (isError) {
    const isPermissionError = error?.status === 403
    const isNetworkError = !error?.status

    bodyContent = (
      <TableRow>
        <TableCell colSpan={columnCount} className="h-64 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-8">
            {isPermissionError ? (
              <LockKeyIcon className="size-10 text-muted-foreground" />
            ) : isNetworkError ? (
              <WifiSlashIcon className="size-10 text-muted-foreground" />
            ) : (
              <ArrowClockwiseIcon className="size-10 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="font-medium">
                {isPermissionError
                  ? t("permissionErrorTitle")
                  : isNetworkError
                    ? t("networkErrorTitle")
                    : t("loadErrorTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPermissionError
                  ? t("permissionErrorDescription")
                  : isNetworkError
                    ? t("networkErrorDescription")
                    : (error?.message ?? t("loadErrorDescription"))}
              </p>
            </div>
            {!isPermissionError && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <ArrowClockwiseIcon />
                {t("retry")}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  } else if (brands.length === 0) {
    bodyContent = (
      <TableRow>
        <TableCell colSpan={columnCount} className="h-64 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-8">
            {hasActiveFilters ? (
              <MagnifyingGlassIcon className="size-10 text-muted-foreground" />
            ) : (
              <StorefrontIcon className="size-10 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="font-medium">
                {hasActiveFilters
                  ? t("noResultsTitle")
                  : t("emptyStateTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? t("noResultsDescription")
                  : t("emptyStateDescription")}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                {t("clearFilters")}
              </Button>
            ) : (
              <Button size="sm" onClick={onCreateClick}>
                {t("createBrand")}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  } else {
    bodyContent = brands.map((brand) => (
      <TableRow key={brand.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <BrandLogo brand={brand} />
            <span className="font-medium">{brand.name}</span>
          </div>
        </TableCell>
        <TableCell className="hidden max-w-64 truncate lg:table-cell">
          {brand.description || (
            <span className="text-muted-foreground">
              {t("noDescription")}
            </span>
          )}
        </TableCell>
        <TableCell>
          <BrandStatusBadge brand={brand} />
        </TableCell>
        <TableCell className="text-muted-foreground">
          {format.dateTime(new Date(brand.createdAt), { dateStyle: "medium" })}
        </TableCell>
        <TableCell className="text-right">
          <BrandRowActions
            brand={brand}
            onEditBrand={onEditBrand}
            onToggleStatus={onToggleStatus}
          />
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div
      className={cn(
        "hidden md:block",
        isFetching && !isLoading && "opacity-60 transition-opacity duration-200 ease-in-out"
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columnName")}</TableHead>
            <TableHead className="hidden lg:table-cell">
              {t("columnDescription")}
            </TableHead>
            <TableHead>{t("columnStatus")}</TableHead>
            <TableHead>{t("columnCreatedAt")}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t("columnActions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{bodyContent}</TableBody>
      </Table>
    </div>
  )
}

export function BrandsCardList({
  brands,
  isLoading,
  isFetching,
  isError,
  error,
  onRetry,
  pageSize,
  hasActiveFilters,
  onClearFilters,
  onCreateClick,
  onEditBrand,
  onToggleStatus,
}: BrandsTableProps) {
  const t = useTranslations("Brands")
  const format = useFormatter()
  const skeletonRowCount = Math.min(pageSize, SKELETON_ROW_COUNT)

  return (
    <div
      className={cn(
        "block space-y-3 p-4 md:hidden",
        isFetching && !isLoading && "opacity-60 transition-opacity duration-200 ease-in-out"
      )}
    >
      {isLoading &&
        Array.from({ length: Math.min(skeletonRowCount, 4) }).map(
          (_, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          )
        )}

      {!isLoading && isError && (
        <Card>
          <CardHeader className="items-center text-center">
            {error?.status === 403 ? (
              <LockKeyIcon className="size-10 text-muted-foreground" />
            ) : !error?.status ? (
              <WifiSlashIcon className="size-10 text-muted-foreground" />
            ) : (
              <ArrowClockwiseIcon className="size-10 text-muted-foreground" />
            )}
            <CardTitle>
              {error?.status === 403
                ? t("permissionErrorTitle")
                : !error?.status
                  ? t("networkErrorTitle")
                  : t("loadErrorTitle")}
            </CardTitle>
            <CardDescription>
              {error?.status === 403
                ? t("permissionErrorDescription")
                : !error?.status
                  ? t("networkErrorDescription")
                  : (error?.message ?? t("loadErrorDescription"))}
            </CardDescription>
          </CardHeader>
          {error?.status !== 403 && (
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-full"
              >
                <ArrowClockwiseIcon />
                {t("retry")}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {!isLoading && !isError && brands.length === 0 && (
        <Card>
          <CardHeader className="items-center text-center">
            {hasActiveFilters ? (
              <MagnifyingGlassIcon className="size-10 text-muted-foreground" />
            ) : (
              <StorefrontIcon className="size-10 text-muted-foreground" />
            )}
            <CardTitle>
              {hasActiveFilters ? t("noResultsTitle") : t("emptyStateTitle")}
            </CardTitle>
            <CardDescription>
              {hasActiveFilters
                ? t("noResultsDescription")
                : t("emptyStateDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full"
              >
                {t("clearFilters")}
              </Button>
            ) : (
              <Button size="sm" onClick={onCreateClick} className="w-full">
                {t("createBrand")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        !isError &&
        brands.map((brand) => (
          <Card key={brand.id}>
            <CardContent className="flex items-start gap-3">
              <BrandLogo brand={brand} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">{brand.name}</p>
                {brand.description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {brand.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format.dateTime(new Date(brand.createdAt), {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <BrandStatusBadge brand={brand} />
                <BrandRowActions
                  brand={brand}
                  onEditBrand={onEditBrand}
                  onToggleStatus={onToggleStatus}
                />
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
