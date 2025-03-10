/*
This client component provides a subscription promotion banner for the sidebar.
*/

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowUpRight, X, CheckCircle2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { motion } from "framer-motion"

type SubscriptionTier = "trial" | "basic" | "advanced" | "expert"

interface SubscriptionPromoProps {
  currentTier: SubscriptionTier
  trialDaysLeft?: number
  isCollapsed: boolean
}

export function SubscriptionPromo({
  currentTier,
  trialDaysLeft = 14,
  isCollapsed
}: SubscriptionPromoProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || currentTier === "expert") return null

  // Define tier details
  const tiers = {
    trial: {
      name: "Trial",
      color: "bg-amber-500",
      next: "basic",
      cta: "Subscribe Now",
      message: `${trialDaysLeft} days left in your trial`
    },
    basic: {
      name: "Basic",
      color: "bg-blue-500",
      next: "advanced",
      cta: "Upgrade to Advanced",
      message: "Unlock more experiments"
    },
    advanced: {
      name: "Advanced",
      color: "bg-purple-500",
      next: "expert",
      cta: "Upgrade to Expert",
      message: "Unlock full configuration"
    },
    expert: {
      name: "Expert",
      color: "bg-emerald-500",
      next: null,
      cta: "",
      message: ""
    }
  }

  const currentTierInfo = tiers[currentTier]
  const nextTier = currentTierInfo.next
    ? tiers[currentTierInfo.next as SubscriptionTier]
    : null

  if (isCollapsed) {
    return (
      <div className="px-2 py-3">
        <Link href="/dashboard/billing">
          <Button
            variant="outline"
            className={cn(
              "relative h-10 w-full border-2 border-dashed p-0",
              currentTier === "trial" ? "animate-pulse border-amber-500" : ""
            )}
          >
            <Sparkles className="size-5 text-amber-500" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative m-3 overflow-hidden rounded-lg border-2 border-dashed p-3",
        currentTier === "trial" ? "border-amber-500" : "border-blue-500"
      )}
    >
      <button
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute right-2 top-2 rounded-full p-0.5"
        onClick={() => setIsDismissed(true)}
      >
        <X className="size-3" />
      </button>

      <div className="mb-1 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "bg-opacity-15 text-xs font-medium",
            currentTierInfo.color
          )}
        >
          {currentTierInfo.name}
        </Badge>
        {currentTier === "trial" && (
          <span className="text-xs font-medium text-amber-500">
            {trialDaysLeft} days left
          </span>
        )}
      </div>

      {currentTier === "trial" ? (
        <>
          <h4 className="mb-1 text-sm font-semibold">
            Upgrade Your Experience
          </h4>
          <p className="text-muted-foreground mb-3 text-xs">
            Subscribe now to unlock full access to all features.
          </p>
        </>
      ) : (
        <>
          <h4 className="mb-1 text-sm font-semibold">Ready for More?</h4>
          <p className="text-muted-foreground mb-3 text-xs">
            Upgrade to {nextTier?.name} tier to unlock advanced features.
          </p>
        </>
      )}

      <Link href="/dashboard/billing">
        <Button size="sm" className="w-full gap-1">
          {currentTier === "trial" ? (
            <>
              <Crown className="size-3.5" />
              <span>Subscribe Now</span>
            </>
          ) : (
            <>
              <span>Upgrade</span>
              <ArrowUpRight className="size-3.5" />
            </>
          )}
        </Button>
      </Link>

      {currentTier === "trial" && (
        <div className="mt-2 flex gap-2 text-xs">
          <div className="text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>Basic: $9.99/mo</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>No credit card</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
