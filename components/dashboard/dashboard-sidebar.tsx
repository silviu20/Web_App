/*
This client component provides the dashboard sidebar with navigation and account section.
*/

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  BarChart,
  Home,
  Settings,
  HelpCircle,
  History,
  LogOut,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Beaker,
  LineChart,
  FileCog,
  Sun,
  Moon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

const dashboardLinks = [
  { href: "/dashboard/home", label: "Home", icon: <Home className="size-5" /> },
  {
    href: "/dashboard/experiments",
    label: "Experiments",
    icon: <Beaker className="size-5" />
  },
  {
    href: "/dashboard/optimization",
    label: "Optimization",
    icon: <FileCog className="size-5" />
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: <LineChart className="size-5" />
  }
]

export function DashboardSidebar() {
  const { user, isSignedIn } = useUser()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [accountExpanded, setAccountExpanded] = useState(false)
  const router = useRouter()

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.firstName && !user?.lastName) {
      return (
        user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U"
      )
    }
    return `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`
  }

  const handleSignOut = async () => {
    router.push("/login")
  }

  return (
    <div className="bg-sidebar border-sidebar-border flex w-64 flex-col border-r">
      {/* Logo and App name */}
      <div className="flex items-center gap-2 p-6">
        <LayoutDashboard className="size-6" />
        <span className="text-xl font-bold">SynSilicO™</span>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {dashboardLinks.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User account section */}
      <div className="mt-auto border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-accent/50 w-full justify-start px-3"
              onClick={() => setAccountExpanded(!accountExpanded)}
            >
              <div className="flex w-full items-center">
                <Avatar className="mr-2 size-8">
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName || ""}
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">
                    {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                  <p className="text-muted-foreground text-xs">Free Plan</p>
                </div>
                {accountExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem className="flex cursor-default justify-between p-2">
              <span>Theme</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setTheme("light")}
                >
                  <Sun
                    className={cn(
                      "size-4",
                      theme === "dark" && "text-muted-foreground"
                    )}
                  />
                  <span className="sr-only">Light</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setTheme("dark")}
                >
                  <Moon
                    className={cn(
                      "size-4",
                      theme === "light" && "text-muted-foreground"
                    )}
                  />
                  <span className="sr-only">Dark</span>
                </Button>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="flex cursor-pointer items-center"
              >
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/help"
                className="flex cursor-pointer items-center"
              >
                <HelpCircle className="mr-2 size-4" />
                <span>Help Center</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/history"
                className="flex cursor-pointer items-center"
              >
                <History className="mr-2 size-4" />
                <span>History</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/billing"
                className="flex cursor-pointer items-center"
              >
                <BarChart className="mr-2 size-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/login"
                className="flex cursor-pointer items-center text-red-500"
              >
                <LogOut className="mr-2 size-4" />
                <span>Sign out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
