"use client"

import { ThemeProvider } from "next-themes"

import { QueryProvider } from "@/providers/query-provider"
import { PlatformConfigProvider } from "@/providers/platform-config-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <PlatformConfigProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors closeButton />
          </TooltipProvider>
        </PlatformConfigProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
