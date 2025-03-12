// app/dashboard/optimizations/[id]/not-found.tsx
"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Beaker, ArrowLeft } from "lucide-react"

export default function OptimizationNotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center">
      <Beaker className="text-muted-foreground mb-4 size-16" />
      <h2 className="mb-2 text-2xl font-bold">Optimization Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-center">
        We couldn't find the optimization you're looking for. It may have been
        deleted, or you don't have access to it.
      </p>
      <div className="flex space-x-4">
        <Button asChild>
          <Link href="/dashboard/optimizations">
            <ArrowLeft className="mr-2 size-4" />
            Back to Optimizations
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/optimizations/create">
            <Beaker className="mr-2 size-4" />
            Create New Optimization
          </Link>
        </Button>
      </div>
    </div>
  )
}
