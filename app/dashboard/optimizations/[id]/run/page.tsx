// app/dashboard/optimizations/[id]/run/page.tsx
"use server"

import { Button } from "@/components/ui/button"
import { RunExperiment } from "@/components/optimization/run-experiment"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getOptimizationByIdAction } from "@/actions/db/optimizations-actions"
import Link from "next/link"
import { ArrowLeft, BarChart } from "lucide-react"

interface RunExperimentPageProps {
  params: Promise<{ id: string }>
}

export default async function RunExperimentPage({
  params
}: RunExperimentPageProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/optimizations/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" />
              Back to Details
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{optimization.name}</h1>
        </div>
        <Link href={`/dashboard/optimizations/${id}`}>
          <Button variant="outline">
            <BarChart className="mr-2 size-4" />
            View Results
          </Button>
        </Link>
      </div>

      <RunExperiment optimization={optimization} />
    </div>
  )
}
