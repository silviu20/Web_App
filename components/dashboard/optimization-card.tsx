// components/dashboard/optimization-card.tsx
"use client"

import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Beaker,
  Activity,
  Target
} from "lucide-react"
import Link from "next/link"

interface OptimizationCardProps {
  optimization: SelectOptimization
  index: number
}

export function OptimizationCard({
  optimization,
  index
}: OptimizationCardProps) {
  // Animation delay based on index (staggered effect)
  const delay = index * 0.1

  // Status color mapping
  const statusColors = {
    active: "bg-green-500",
    paused: "bg-amber-500",
    completed: "bg-blue-500",
    draft: "bg-gray-500",
    failed: "bg-red-500"
  }

  // Parameter count
  const parameterCount = optimization.config?.parameters?.length || 0

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        href={`/dashboard/optimizations/${optimization.id}`}
        className="block transition-transform hover:scale-[1.02]"
      >
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="truncate">{optimization.name}</CardTitle>
              <div
                className={`size-2 rounded-full ${
                  statusColors[
                    optimization.status as keyof typeof statusColors
                  ] || statusColors.draft
                }`}
              />
            </div>
            <p className="text-muted-foreground truncate text-sm">
              {optimization.description || "No description provided"}
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Target:</div>
                <div className="flex items-center font-medium">
                  {optimization.targetName}
                  {optimization.targetMode === "MAX" ? (
                    <ArrowUp className="ml-1 size-4 text-green-500" />
                  ) : (
                    <ArrowDown className="ml-1 size-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">Status:</div>
                <div className="font-medium capitalize">
                  {optimization.status}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">Created:</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(optimization.createdAt), {
                    addSuffix: true
                  })}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/40 flex items-center justify-between border-t p-2">
            <div className="text-muted-foreground flex items-center text-sm">
              <Beaker className="mr-1 size-4" />
              <span>Parameters: {parameterCount}</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <div>
                <Activity className="mr-1 size-4" />
                View Details
              </div>
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
