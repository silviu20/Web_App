// app/dashboard/optimizations/[id]/page.tsx
"use server"

import { Button } from "@/components/ui/button"
import { OptimizationResults } from "@/components/optimization/optimization-results"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import {
  getOptimizationByIdAction,
  getMeasurementsAction
} from "@/actions/db/optimizations-actions"
import { getBestPointWorkflowAction } from "@/actions/optimization-workflow-actions"
import Link from "next/link"
import { Beaker, ArrowLeft } from "lucide-react"
import { OptimizationDashboard as OptimizationResults } from "@/components/dashboard/optimization-dashboard"

interface OptimizationDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function OptimizationDetailsPage({
  params
}: OptimizationDetailsPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const { id } = await params

  // Get the optimization from the database
  const optimizationResult = await getOptimizationByIdAction(id)

  if (!optimizationResult.isSuccess || !optimizationResult.data) {
    notFound()
  }

  const optimization = optimizationResult.data

  // Make sure the optimization belongs to the current user
  if (optimization.userId !== userId) {
    redirect("/dashboard/optimizations")
  }

  // Get measurements for this optimization
  const measurementsResult = await getMeasurementsAction(optimization.id)
  const measurements = measurementsResult.isSuccess
    ? measurementsResult.data
    : []

  // Get the current best point from the API
  const bestPointResult = await getBestPointWorkflowAction(
    optimization.optimizerId
  )
  const bestPoint = bestPointResult.isSuccess ? bestPointResult.data : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/optimizations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Button>
          </Link>
        </div>
        <Link href={`/dashboard/optimizations/${id}/run`}>
          <Button>
            <Beaker className="mr-2 size-4" />
            Run Experiments
          </Button>
        </Link>
      </div>

      <OptimizationResults
        optimization={optimization}
        measurements={measurements}
        initialBestPoint={bestPoint}
      />
    </div>
  )
}
