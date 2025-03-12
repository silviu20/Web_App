/*
This client component provides the dashboard sidebar with navigation, account section, 
collapsible functionality, and subscription promotion.
*/

"use client"

import { useState, useEffect } from "react"
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
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { SubscriptionPromo } from "@/components/dashboard/subscription-promo"

const dashboardLinks = [
  { href: "/dashboard/home", label: "Home", icon: <Home className="size-5" /> },
  {
    href: "/dashboard/experiments",
    label: "Experiments",
    icon: <Beaker className="size-5" />
  },
  {
    href: "/dashboard/optimizations",
    label: "Optimizations",
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
  const [collapsed, setCollapsed] = useState(false)

  // This will be replaced with actual user subscription data in a real implementation
  // For demo purposes, we're determining it randomly here
  const [userTier, setUserTier] = useState<
    "trial" | "basic" | "advanced" | "expert"
  >("trial")
  const [trialDaysLeft, setTrialDaysLeft] = useState(14)

  // In a real app, you'd fetch this from your backend
  useEffect(() => {
    // Simulate fetching user tier - in a real app, get this from your API
    const tiers = ["trial", "basic", "advanced", "expert"] as const
    const randomTier = tiers[Math.floor(Math.random() * 2)] // Mostly trial or basic for demo
    setUserTier(randomTier)

    // Random days left in trial
    if (randomTier === "trial") {
      setTrialDaysLeft(Math.floor(Math.random() * 14) + 1)
    }
  }, [])

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    // Check initially
    checkMobile()

    // Add event listener
    window.addEventListener("resize", checkMobile)

    // Clean up
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.firstName && !user?.lastName) {
      return (
        user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U"
      )
    }
    return `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`
  }

  // Get plan name based on tier
  const getPlanName = () => {
    switch (userTier) {
      case "trial":
        return "Trial"
      case "basic":
        return "Basic Plan"
      case "advanced":
        return "Advanced Plan"
      case "expert":
        return "Expert Plan"
      default:
        return "Free Plan"
    }
  }

  return (
    <div
      className={cn(
        "bg-sidebar border-sidebar-border flex h-screen flex-col border-r transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64"
      )}
    >
      {/* Logo and App name */}
      <div
        className={cn(
          "flex items-center gap-2 p-4 transition-all",
          collapsed ? "justify-center" : ""
        )}
      >
        <LayoutDashboard className="size-6 shrink-0" />
        {!collapsed && (
          <span className="whitespace-nowrap text-xl font-bold">
            SynSilicO™
          </span>
        )}
      </div>

      {/* Collapse/expand button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "my-1 mr-2 size-8 self-end p-0",
          collapsed && "mr-0 self-center"
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </Button>

      {/* Main navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {dashboardLinks.map(link => (
            <li key={link.href}>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                        collapsed ? "justify-center px-2" : "px-3"
                      )}
                    >
                      {link.icon}
                      {!collapsed && (
                        <span className="truncate">{link.label}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </nav>

      {/* Subscription promo section */}
      <SubscriptionPromo
        currentTier={userTier}
        trialDaysLeft={trialDaysLeft}
        isCollapsed={collapsed}
      />

      {/* User account section */}
      <div className="mt-auto border-t p-2">
        <DropdownMenu>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "hover:bg-accent/50 w-full justify-start truncate",
                      collapsed ? "px-2" : "px-3"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center",
                        collapsed ? "w-full justify-center" : "w-full"
                      )}
                    >
                      <Avatar className={cn("size-8", collapsed ? "" : "mr-2")}>
                        <AvatarImage
                          src={user?.imageUrl}
                          alt={user?.fullName || ""}
                        />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      {!collapsed && (
                        <>
                          <div className="flex-1 text-left">
                            <p className="truncate text-sm font-medium">
                              {user?.fullName ||
                                user?.emailAddresses?.[0]?.emailAddress}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {getPlanName()}
                            </p>
                          </div>
                          <ChevronDown className="size-4" />
                        </>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
                  <br />
                  <span className="text-muted-foreground text-xs">
                    {getPlanName()}
                  </span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem className="focus:bg-background cursor-default">
              <div className="flex w-full flex-col space-y-1">
                <span className="mb-1 text-sm font-medium">Theme</span>
                <div className="flex flex-col space-y-1">
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === "light"}
                      onChange={() => setTheme("light")}
                      className="size-4"
                    />
                    <span className="flex items-center text-sm">
                      <Sun className="mr-1 size-4" /> Light
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === "dark"}
                      onChange={() => setTheme("dark")}
                      className="size-4"
                    />
                    <span className="flex items-center text-sm">
                      <Moon className="mr-1 size-4" /> Dark
                    </span>
                  </label>
                </div>
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
