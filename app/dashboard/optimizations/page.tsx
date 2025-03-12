// app/dashboard/optimizations/page.tsx
"use server"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Plus, Beaker, Activity, ArrowUp, ArrowDown } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getOptimizationsAction } from "@/actions/db/optimizations-actions"
import { checkAPIHealth } from "@/actions/optimization-actions"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function OptimizationsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login?redirect_url=/dashboard/optimizations")
  }

  // Check if the API is available
  const apiStatus = await checkAPIHealth()
  const apiAvailable = apiStatus.isSuccess
  const usingGPU = apiStatus.isSuccess && apiStatus.data.using_gpu

  // Get optimizations for this user
  const optimizationsResult = await getOptimizationsAction(userId)
  const optimizations = optimizationsResult.isSuccess
    ? optimizationsResult.data
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Optimizations</h1>
        <Link href="/dashboard/optimizations/create">
          <Button>
            <Plus className="mr-2 size-4" />
            New Optimization
          </Button>
        </Link>
      </div>

      {/* API Status Card */}
      <Card className={apiAvailable ? "border-green-500" : "border-red-500"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">BayBE API Status</CardTitle>
          <CardDescription>Status of the Bayesian Backend API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div
              className={`size-3 rounded-full ${apiAvailable ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <div>
              <p className="font-medium">
                {apiAvailable ? "Connected" : "Disconnected"}
              </p>
              <p className="text-muted-foreground text-sm">
                {apiAvailable
                  ? `Using ${usingGPU ? "GPU acceleration" : "CPU mode"}`
                  : "Unable to connect to the BayBE API"}
              </p>
            </div>
          </div>

          {apiAvailable && apiStatus.data.gpu_info && (
            <div className="bg-muted mt-4 rounded-md p-3">
              <p className="text-sm font-medium">GPU Information</p>
              <p className="text-muted-foreground text-xs">
                {apiStatus.data.gpu_info.name} - Memory:{" "}
                {apiStatus.data.gpu_info.memory_allocated_mb.toFixed(2)} MB
                allocated
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimizations Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {optimizations.map(optimization => (
          <Link
            href={`/dashboard/optimizations/${optimization.id}`}
            key={optimization.id}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="truncate">
                    {optimization.name}
                  </CardTitle>
                  <div
                    className={`size-2 rounded-full ${
                      optimization.status === "active"
                        ? "bg-green-500"
                        : optimization.status === "paused"
                          ? "bg-amber-500"
                          : optimization.status === "completed"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                    }`}
                  />
                </div>
                <CardDescription className="truncate">
                  {optimization.description || "No description provided"}
                </CardDescription>
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
                  <span>
                    Parameters: {optimization.config.parameters.length}
                  </span>
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
        ))}
      </div>

      {/* Empty State */}
      {optimizations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Beaker className="text-muted-foreground mb-4 size-16" />
            <h3 className="mb-2 text-xl font-medium">No optimizations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              Create your first optimization to start leveraging Bayesian
              techniques for experiment design and parameter tuning.
            </p>
            <Link href="/dashboard/optimizations/create">
              <Button>
                <Plus className="mr-2 size-4" />
                Create Your First Optimization
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
