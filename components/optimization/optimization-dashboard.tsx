// components/optimization/optimization-dashboard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import {
  BarChart,
  Check,
  Clock,
  FileEdit,
  History,
  Play,
  Plus,
  RefreshCw,
  Trash,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { deleteOptimizationAction } from "@/actions/db/optimizations-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"

interface OptimizationDashboardProps {
  optimizations: SelectOptimization[]
  isApiAvailable?: boolean
  usingGpu?: boolean
}

export function OptimizationDashboard({
  optimizations,
  isApiAvailable = true,
  usingGpu = false
}: OptimizationDashboardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")

  // Filter optimization based on the active tab
  const filteredOptimizations = optimizations.filter(opt => {
    if (activeTab === "all") return true
    return opt.status === activeTab
  })

  // Stats
  const activeCount = optimizations.filter(
    opt => opt.status === "active"
  ).length
  const completedCount = optimizations.filter(
    opt => opt.status === "completed"
  ).length
  const draftCount = optimizations.filter(opt => opt.status === "draft").length

  const handleDelete = async (id: string) => {
    setIsDeleting(id)

    try {
      const result = await deleteOptimizationAction(id)

      if (result.isSuccess) {
        toast({
          title: "Optimization deleted",
          description: "The optimization has been successfully deleted"
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold">Optimizations</h1>
        <Link href="/dashboard/optimizations/create">
          <Button>
            <Plus className="mr-2 size-4" />
            New Optimization
          </Button>
        </Link>
      </div>

      {/* API Status Card */}
      <Card className={isApiAvailable ? "border-green-500" : "border-red-500"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">BayBE API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div
              className={`size-3 rounded-full ${isApiAvailable ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <div>
              <p className="font-medium">
                {isApiAvailable ? "Connected" : "Disconnected"}
              </p>
              <p className="text-muted-foreground text-sm">
                {isApiAvailable
                  ? `Using ${usingGpu ? "GPU acceleration" : "CPU mode"}`
                  : "Unable to connect to the BayBE API"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optimizations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-bold ${isApiAvailable ? "text-green-500" : "text-red-500"}`}
            >
              {isApiAvailable
                ? usingGpu
                  ? "GPU Acceleration"
                  : "CPU Mode"
                : "Unavailable"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization List Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({optimizations.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="draft">Draft ({draftCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {optimizations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {optimizations.map(optimization => (
                <OptimizationCard
                  key={optimization.id}
                  optimization={optimization}
                  onDelete={() => handleDelete(optimization.id)}
                  isDeleting={isDeleting === optimization.id}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Info className="text-muted-foreground mb-4 size-16" />
                <h3 className="mb-2 text-xl font-medium">
                  No optimizations found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md text-center">
                  Create your first optimization to start leveraging Bayesian
                  techniques for experiment design.
                </p>
                <Link href="/dashboard/optimizations/create">
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Create Optimization
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active">
          {filteredOptimizations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOptimizations.map(optimization => (
                <OptimizationCard
                  key={optimization.id}
                  optimization={optimization}
                  onDelete={() => handleDelete(optimization.id)}
                  isDeleting={isDeleting === optimization.id}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Info className="text-muted-foreground mb-4 size-16" />
                <h3 className="mb-2 text-xl font-medium">
                  No active optimizations found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md text-center">
                  You don't have any active optimizations yet.
                </p>
                <Link href="/dashboard/optimizations/create">
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Create Optimization
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {filteredOptimizations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOptimizations.map(optimization => (
                <OptimizationCard
                  key={optimization.id}
                  optimization={optimization}
                  onDelete={() => handleDelete(optimization.id)}
                  isDeleting={isDeleting === optimization.id}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Info className="text-muted-foreground mb-4 size-16" />
                <h3 className="mb-2 text-xl font-medium">
                  No completed optimizations found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md text-center">
                  You don't have any completed optimizations yet.
                </p>
                <Link href="/dashboard/optimizations/create">
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Create Optimization
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="draft">
          {filteredOptimizations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOptimizations.map(optimization => (
                <OptimizationCard
                  key={optimization.id}
                  optimization={optimization}
                  onDelete={() => handleDelete(optimization.id)}
                  isDeleting={isDeleting === optimization.id}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Info className="text-muted-foreground mb-4 size-16" />
                <h3 className="mb-2 text-xl font-medium">
                  No draft optimizations found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md text-center">
                  You don't have any draft optimizations yet.
                </p>
                <Link href="/dashboard/optimizations/create">
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Create Optimization
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface OptimizationCardProps {
  optimization: SelectOptimization
  onDelete: () => void
  isDeleting: boolean
}

function OptimizationCard({
  optimization,
  onDelete,
  isDeleting
}: OptimizationCardProps) {
  const router = useRouter()

  // Status badge color
  const statusColors = {
    active: "bg-green-500 hover:bg-green-600",
    paused: "bg-yellow-500 hover:bg-yellow-600",
    completed: "bg-blue-500 hover:bg-blue-600",
    draft: "bg-gray-500 hover:bg-gray-600",
    failed: "bg-red-500 hover:bg-red-600"
  }

  // Parameter count
  const parameterCount = optimization.config.parameters.length

  // Created time
  const createdTime = formatDistanceToNow(new Date(optimization.createdAt), {
    addSuffix: true
  })

  return (
    <Card className="overflow-hidden border transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/optimizations/${optimization.id}`}
            className="truncate hover:underline"
          >
            <CardTitle className="text-lg">{optimization.name}</CardTitle>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/optimizations/${optimization.id}`)
                }
              >
                <BarChart className="mr-2 size-4" />
                View Results
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/optimizations/${optimization.id}/run`)
                }
              >
                <Play className="mr-2 size-4" />
                Run Experiments
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete()}
                className="text-red-600"
              >
                <Trash className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-muted-foreground truncate text-sm">
          {optimization.description || "No description"}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs font-medium">Status</p>
              <div className="flex items-center">
                <div
                  className={`size-2 rounded-full ${statusColors[optimization.status as keyof typeof statusColors]?.split(" ")[0]}`}
                ></div>
                <span className="ml-1.5 text-sm capitalize">
                  {optimization.status}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Target</p>
              <div className="flex items-center">
                {optimization.targetMode === "MAX" ? (
                  <ChevronUp className="size-4 text-green-500" />
                ) : (
                  <ChevronDown className="size-4 text-blue-500" />
                )}
                <span className="ml-0.5 text-sm">
                  {optimization.targetName}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Parameters</p>
              <p className="text-sm">{parameterCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Created</p>
              <p className="text-sm">{createdTime}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link
              href={`/dashboard/optimizations/${optimization.id}`}
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <BarChart className="mr-1 size-4" />
                Results
              </Button>
            </Link>
            <Link
              href={`/dashboard/optimizations/${optimization.id}/run`}
              className="flex-1"
            >
              <Button size="sm" className="w-full">
                <Play className="mr-1 size-4" />
                Run
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
