"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CaretLineLeftIcon,
  CaretLineRightIcon,
  CaretRightIcon,
  SignOutIcon,
  XIcon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { useAuthStore, usePlatformConfig } from "@/providers";
import { logout } from "@/modules/auth";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SIDEBAR_DESKTOP_BREAKPOINT } from "@/components/layout/sidebar-constants";
import { navGroups, type NavChildItem, type NavItem } from "@/config/nav";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function isChildActive(pathname: string, child: NavChildItem) {
  return pathname === child.href;
}

function collapsibleLabelClassName(collapsed: boolean) {
  return cn(
    "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-in-out",
    collapsed ? "xl:w-0 xl:opacity-0" : "xl:opacity-100",
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavChildItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const t = useTranslations("Nav");

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex font-semibold items-center gap-2.5 rounded-full px-3 py-1.5 text-xs transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          active ? "bg-primary" : "bg-sidebar-foreground/30",
        )}
      />
      {t(item.labelKey)}
    </Link>
  );
}

function NavGroupItem({
  item,
  pathname,
  collapsed,
  iconRail,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  iconRail: boolean;
  onNavigate: () => void;
}) {
  const t = useTranslations("Nav");

  const active = item.items
    ? item.items.some((child) => isChildActive(pathname, child))
    : item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href!);

  // Auto-open when navigation makes this section active, without fighting
  // manual toggles: track the open/active pair and only nudge `open` to
  // true on the active:false -> true transition (React's "adjusting state
  // when a prop changes" pattern, safe to call during render).
  const [state, setState] = useState({ open: active, active });
  if (active !== state.active) {
    setState({ open: active ? true : state.open, active });
  }
  const open = state.open;
  const setOpen = (value: boolean) => setState((s) => ({ ...s, open: value }));

  const itemClassName = (isActive: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200 ease-in-out",
      collapsed && "xl:justify-center xl:gap-0 xl:px-2",
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    );

  const labelClassName = collapsibleLabelClassName(collapsed);

  if (!item.items) {
    const link = (
      <Link
        href={item.href!}
        onClick={onNavigate}
        className={itemClassName(active)}
      >
        <item.icon
          weight={active ? "fill" : "regular"}
          className="size-4.5 shrink-0"
        />
        <span className={labelClassName}>{t(item.labelKey)}</span>
        {item.badge && (
          <span
            className={cn(
              "ml-auto rounded-full bg-sidebar-primary px-1.5 py-0.5 text-xs text-sidebar-primary-foreground",
              labelClassName,
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (!iconRail) return link;

    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
      </Tooltip>
    );
  }

  if (iconRail) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className={itemClassName(active)}>
              <item.icon
                weight={active ? "fill" : "regular"}
                className="size-4.5 shrink-0"
              />
            </button>
          }
        />
        <DropdownMenuContent side="right" align="start" className="min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t(item.labelKey)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.items.map((child) => (
              <DropdownMenuItem
                key={child.href}
                data-variant={
                  isChildActive(pathname, child) ? "default" : undefined
                }
                render={
                  <Link href={child.href} onClick={onNavigate}>
                    {t(child.labelKey)}
                  </Link>
                }
              />
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className={cn("group w-full", itemClassName(active))}
          />
        }
      >
        <item.icon
          weight={active ? "fill" : "regular"}
          className="size-4.5 shrink-0"
        />
        <span className={cn("flex-1 text-left", labelClassName)}>
          {t(item.labelKey)}
        </span>
        <CaretRightIcon
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200 group-data-[panel-open]:rotate-90",
            collapsed && "xl:hidden",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[starting-style]:h-0 data-[ending-style]:h-0">
        <div className="flex flex-col gap-1 py-1 pl-7">
          {item.items.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              active={isChildActive(pathname, child)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const close = () => setSidebarOpen(false);
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_BREAKPOINT);
  const iconRail = collapsed && isDesktop;
  const setUser = useAuthStore((state) => state.setUser);
  const { config } = usePlatformConfig();
  const displayName = config?.branding?.platformDisplayName || "Quick Commerce";

  const { mutate: performLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      router.push("/login");
    },
    onError: () => {
      toast.error(t("logout"), { description: t("logoutError") });
    },
  });

  const handleLogout = () => performLogout();

  const logoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "w-full cursor-pointer flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 transition-all duration-200 ease-in-out hover:bg-destructive/10 hover:text-destructive",
        collapsed && "xl:justify-center xl:gap-0 xl:px-2",
      )}
    >
      <SignOutIcon className="size-4.5 shrink-0" />
      <span className={collapsibleLabelClassName(collapsed)}>
        {t("logout")}
      </span>
    </button>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-200 ease-in-out xl:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-in-out xl:translate-x-0",
          sidebarOpen
            ? "translate-x-0 shadow-2xl xl:shadow-none"
            : "-translate-x-full",
          collapsed ? "xl:w-17" : "xl:w-64",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center justify-between px-4 transition-all duration-200 ease-in-out",
            collapsed && "xl:justify-center xl:px-2",
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 truncate font-semibold"
          >
            {config?.branding?.admin?.lightLogo ? (
              <img
                src={config.branding.admin.lightLogo}
                alt={displayName}
                className="size-6 shrink-0 object-contain rounded-full"
              />
            ) : null}
            <span
              className={cn(
                "truncate transition-opacity duration-200 ease-in-out",
                collapsibleLabelClassName(collapsed)
              )}
            >
              {displayName}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={close}
          >
            <XIcon className="size-4" />
            <span className="sr-only">{t("closeSidebar")}</span>
          </Button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute top-7 cursor-pointer right-0 z-10 hidden size-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-white text-zinc-600 shadow-md transition-colors hover:bg-zinc-50 hover:text-zinc-900 xl:flex"
        >
          {collapsed ? (
            <CaretLineRightIcon className="size-3.5" />
          ) : (
            <CaretLineLeftIcon className="size-3.5" />
          )}
          <span className="sr-only">
            {collapsed ? t("expandSidebar") : t("collapseSidebar")}
          </span>
        </button>

        <nav
          className={cn(
            "flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4",
            "[scrollbar-width:thin] [scrollbar-color:var(--sidebar-border)_transparent]",
          )}
        >
          {navGroups.map((group) => (
            <div key={group.headingKey} className="flex flex-col gap-1">
              <span
                className={cn(
                  "px-3 pb-1 text-[10px] font-bold tracking-wide text-sidebar-foreground/50 uppercase",
                  collapsed && "xl:hidden",
                )}
              >
                {t(group.headingKey)}
              </span>
              {group.items.map((item) => (
                <NavGroupItem
                  key={item.labelKey}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  iconRail={iconRail}
                  onNavigate={close}
                />
              ))}
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "border-t border-sidebar-border p-3",
            collapsed && "xl:px-2",
          )}
        >
          {iconRail ? (
            <Tooltip>
              <TooltipTrigger render={logoutButton} />
              <TooltipContent side="right">{t("logout")}</TooltipContent>
            </Tooltip>
          ) : (
            logoutButton
          )}
        </div>
      </aside>
    </>
  );
}
