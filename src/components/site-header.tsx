"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NAV_SECTIONS } from "@/components/app-sidebar"

export function SiteHeader() {
  const pathname = usePathname()

  // Find the label for the current pathname
  let pageTitle = "Admin Centre"
  for (const section of NAV_SECTIONS) {
    const item = section.items.find(
      (item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    )
    if (item) {
      pageTitle = item.label
      break
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
      </div>
    </header>
  )
}
