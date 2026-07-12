"use client"

import * as React from "react"
import Link from "next/link"
import { CircleNotch } from "@phosphor-icons/react"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

export interface PageHeaderAction {
  label: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  href?: string
  icon?: React.ReactNode
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  loading?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
  id?: string
}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[] | React.ReactNode
  primaryAction?: PageHeaderAction
  secondaryAction?: PageHeaderAction
  actions?: PageHeaderAction[]
  children?: React.ReactNode
  isLoading?: boolean
  disabled?: boolean
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  actions,
  children,
  isLoading = false,
  disabled = false,
  className,
  ...props
}: PageHeaderProps) {
  const renderBreadcrumbs = () => {
    if (!breadcrumbs) return null

    if (React.isValidElement(breadcrumbs)) {
      return breadcrumbs
    }

    if (Array.isArray(breadcrumbs)) {
      return (
        <nav
          className="mb-2 flex items-center space-x-1.5 text-xs font-medium text-muted-foreground/80"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            const isActive = item.active || isLast

            return (
              <React.Fragment key={item.label}>
                {index > 0 && (
                  <span className="mx-1 select-none text-muted-foreground/30">/</span>
                )}
                {item.href && !isActive ? (
                  <Link
                    href={item.href}
                    className="cursor-pointer hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isActive ? "font-semibold text-foreground" : "",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      )
    }

    return null
  }

  const renderAction = (
    action: PageHeaderAction,
    index: number,
    isPrimary = false,
  ) => {
    const {
      label,
      onClick,
      href,
      icon,
      variant = isPrimary ? "default" : "outline",
      size = "default",
      loading = false,
      disabled: actionDisabled = false,
      className: actionClassName,
      ariaLabel,
      id,
    } = action

    const isDisabled = disabled || actionDisabled || loading

    const buttonContent = (
      <>
        {loading ? (
          <CircleNotch className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}
        <span>{label}</span>
      </>
    )

    if (href) {
      return (
        <Link
          key={id || `action-${index}`}
          id={id}
          href={href}
          className={cn(
            buttonVariants({ variant, size, className: actionClassName }),
            isDisabled ? "pointer-events-none opacity-50" : "",
          )}
          aria-disabled={isDisabled}
          aria-label={ariaLabel}
        >
          {buttonContent}
        </Link>
      )
    }

    return (
      <Button
        key={id || `action-${index}`}
        id={id}
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={isDisabled}
        className={cn(actionClassName)}
        aria-label={ariaLabel}
      >
        {buttonContent}
      </Button>
    )
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4",
          className,
        )}
        {...props}
      >
        <div className="flex-1 space-y-2">
          {breadcrumbs && <Skeleton className="h-4 w-32" />}
          <Skeleton className="h-9 w-48" />
          {description && <Skeleton className="h-5 w-80" />}
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          {secondaryAction && <Skeleton className="h-8 w-24" />}
          {actions &&
            actions.map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
          {primaryAction && <Skeleton className="h-8 w-24" />}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4",
        className,
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {renderBreadcrumbs()}
        {typeof title === "string" ? (
          <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
            {title}
          </h1>
        ) : (
          title
        )}
        {description && (
          typeof description === "string" ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : (
            description
          )
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
        {secondaryAction && renderAction(secondaryAction, 0, false)}
        {actions &&
          actions.map((action, index) => renderAction(action, index, false))}
        {children}
        {primaryAction && renderAction(primaryAction, 0, true)}
      </div>
    </div>
  )
}
