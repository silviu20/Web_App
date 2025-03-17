// components/dashboard/optimization-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeatureImportanceChart } from "@/components/optimization/visualization/feature-importance-chart"
import { PredictionSurface } from "@/components/optimization/visualization/prediction-surface"
import { MultiTargetVisualization } from "@/components/optimization/visualization/multi-target-visualization"
import {
  getBestPointWorkflowAction,
  getFeatureImportanceWorkflowAction
} from "@/actions/advanced-optimization-workflow-actions"
import {
  ChevronLeft,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Beaker,
  FileCog,
  Rocket,
  Download,
  AlertCircle,
  MoveHorizontal
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  SelectOptimization,
  SelectMeasurement
} from "@/db/schema/optimizations-schema"

interface OptimizationDashboardProps {
  optimization: SelectOptimization
  measurements: SelectMeasurement[]
  initialBestPoint?: {
    best_parameters?: Record<string, any>
    best_value?: number
  }
  onRefresh?: () => void
}

export function OptimizationDashboard({
  optimization,
  measurements,
  initialBestPoint,
  onRefresh
}: OptimizationDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoadingBest, setIsLoadingBest] = useState(false)
  const [bestPoint, setBestPoint] = useState(initialBestPoint || {})
  const [featureImportance, setFeatureImportance] = useState<
    Record<string, number>
  >({})

  // Get all target information from the optimization
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  // Check if this is a multi-target optimization
  const isMultiTarget = targets.length > 1

  // Format chart data from measurements
  const formatChartData = () => {
    return measurements.map((measurement, index) => ({
      iteration: index + 1,
      targetValue: parseFloat(measurement.targetValue),
      timestamp: new Date(measurement.createdAt).getTime(),
      formattedDate: new Date(measurement.createdAt).toLocaleString(),
      isRecommended: measurement.isRecommended,
      ...measurement.parameters
    }))
  }

  // Calculate best values at each iteration
  const calculateBestValues = (data: any[]) => {
    let bestValue =
      optimization.primaryTargetMode === "MAX" ? -Infinity : Infinity
    return data.map(point => {
      const value = parseFloat(point.targetValue)
      if (optimization.primaryTargetMode === "MAX") {
        bestValue = Math.max(bestValue, value)
      } else {
        bestValue = Math.min(bestValue, value)
      }
      return { ...point, bestValue }
    })
  }

  const chartData = calculateBestValues(formatChartData())

  // Get parameter names from the optimization configuration
  const parameterNames = optimization.config.parameters.map(param => param.name)

  // Refresh best point
  const refreshBestPoint = async () => {
    setIsLoadingBest(true)
    try {
      const result = await getBestPointWorkflowAction(optimization.optimizerId)
      if (result.isSuccess && result.data) {
        setBestPoint(result.data)
        toast({
          title: "Best Point Updated",
          description: "Successfully updated the current best point"
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error refreshing best point:", error)
      toast({
        title: "Error",
        description: "Failed to refresh best point",
        variant: "destructive"
      })
    } finally {
      setIsLoadingBest(false)
    }
  }

  // Get feature importance
  const loadFeatureImportance = async () => {
    try {
      const result = await getFeatureImportanceWorkflowAction(
        optimization.optimizerId
      )
      if (result.isSuccess && result.data) {
        setFeatureImportance(result.data)
      }
    } catch (error) {
      console.error("Error loading feature importance:", error)
    }
  }

  // Load feature importance on initial render
  useEffect(() => {
    if (measurements.length >= 5) {
      loadFeatureImportance()
    }
  }, [])

  // Get target mode icon
  const getTargetModeIcon = (mode: string) => {
    switch (mode) {
      case "MAX":
        return <ArrowUp className="ml-1 inline-block size-5 text-green-500" />
      case "MIN":
        return <ArrowDown className="ml-1 inline-block size-5 text-green-500" />
      case "MATCH":
        return (
          <MoveHorizontal className="ml-1 inline-block size-5 text-blue-500" />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/optimizations">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
          </Link>
        </div>
        <Link href={`/dashboard/optimizations/${optimization.id}/run`}>
          <Button>
            <Beaker className="mr-2 size-4" />
            Run Experiments
          </Button>
        </Link>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Experiments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{measurements.length}</div>
                <p className="text-muted-foreground text-xs">
                  Experiments conducted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Optimization Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-2xl font-bold capitalize">
                  {optimization.status}
                  {optimization.status === "active" && (
                    <div className="ml-2 size-2 animate-pulse rounded-full bg-green-500"></div>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">Current status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isMultiTarget ? "Optimization Targets" : "Target Objective"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMultiTarget ? (
                  <>
                    <div className="text-2xl font-bold">{targets.length}</div>
                    <p className="text-muted-foreground text-xs">
                      {optimization.objectiveType === "desirability"
                        ? "Desirability function"
                        : optimization.objectiveType === "pareto"
                          ? "Pareto optimization"
                          : "Multi-objective"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center text-2xl font-bold">
                      {optimization.primaryTargetName}
                      {getTargetModeIcon(optimization.primaryTargetMode)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {optimization.primaryTargetMode === "MAX"
                        ? "Maximizing"
                        : optimization.primaryTargetMode === "MIN"
                          ? "Minimizing"
                          : "Matching target"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Best {optimization.primaryTargetName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bestPoint?.best_value !== undefined
                    ? bestPoint.best_value.toFixed(4)
                    : "N/A"}
                </div>
                <p className="text-muted-foreground text-xs">
                  Current best result
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Best Point Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Best Result</CardTitle>
                <CardDescription>
                  Current best point found by the optimizer
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBestPoint}
                disabled={isLoadingBest}
              >
                {isLoadingBest ? (
                  <RefreshCw className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {bestPoint?.best_parameters ? (
                <div className="space-y-4">
                  {/* Display all target values for multi-target optimization */}
                  {isMultiTarget ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {targets.map(target => {
                        const targetValue =
                          bestPoint.best_values?.[target.name] ||
                          (target.name === optimization.primaryTargetName
                            ? bestPoint.best_value
                            : undefined)
                        return (
                          <div
                            key={target.name}
                            className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{target.name}</h4>
                              <span className="flex items-center text-xl font-bold">
                                {targetValue !== undefined
                                  ? targetValue.toFixed(4)
                                  : "N/A"}
                                {getTargetModeIcon(target.mode)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {optimization.primaryTargetName}
                        </h4>
                        <span className="flex items-center text-xl font-bold">
                          {bestPoint.best_value?.toFixed(4)}
                          {getTargetModeIcon(optimization.primaryTargetMode)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">Best Parameters:</h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {Object.entries(bestPoint.best_parameters).map(
                        ([key, value]) => (
                          <div key={key} className="rounded-md border p-3">
                            <div className="text-sm font-medium">{key}</div>
                            <div className="mt-1 text-sm">
                              {typeof value === "number"
                                ? value.toFixed(value % 1 === 0 ? 0 : 4)
                                : String(value)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                  <AlertCircle className="mb-4 size-16 opacity-30" />
                  <p>No best point available yet.</p>
                  <p className="text-sm">Add measurements to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Multi-Target Visualization (if applicable) */}
          {isMultiTarget && measurements.length >= 3 && (
            <MultiTargetVisualization
              optimization={optimization}
              measurements={measurements}
            />
          )}

          {/* Recent Measurements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Recent Measurements</CardTitle>
                <CardDescription>Latest experimental results</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="#measurements"
                  onClick={() => setActiveTab("measurements")}
                >
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Iteration</TableHead>
                        <TableHead>Date</TableHead>

                        {/* Show all target values for multi-target */}
                        {isMultiTarget ? (
                          targets.slice(0, 3).map(target => (
                            <TableHead key={target.name} className="text-right">
                              <div className="flex items-center justify-end">
                                {target.name}
                                {getTargetModeIcon(target.mode)}
                              </div>
                            </TableHead>
                          ))
                        ) : (
                          <TableHead className="text-right">
                            <div className="flex items-center justify-end">
                              {optimization.primaryTargetName}
                              {getTargetModeIcon(
                                optimization.primaryTargetMode
                              )}
                            </div>
                          </TableHead>
                        )}

                        {/* Show 2 parameters at most */}
                        {parameterNames.slice(0, 2).map(name => (
                          <TableHead key={name}>{name}</TableHead>
                        ))}
                        <TableHead className="text-right">Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {measurements.slice(0, 5).map((measurement, index) => (
                        <TableRow key={measurement.id}>
                          <TableCell className="font-medium">
                            {measurements.length - index}
                          </TableCell>
                          <TableCell>
                            {new Date(measurement.createdAt).toLocaleString()}
                          </TableCell>

                          {/* Display target values */}
                          {isMultiTarget ? (
                            targets.slice(0, 3).map(target => (
                              <TableCell
                                key={target.name}
                                className="text-right font-medium"
                              >
                                {measurement.targetValues &&
                                measurement.targetValues[target.name]
                                  ? parseFloat(
                                      measurement.targetValues[target.name]
                                    ).toFixed(4)
                                  : target.name ===
                                      optimization.primaryTargetName
                                    ? parseFloat(
                                        measurement.targetValue
                                      ).toFixed(4)
                                    : "N/A"}
                              </TableCell>
                            ))
                          ) : (
                            <TableCell className="text-right font-medium">
                              {parseFloat(measurement.targetValue).toFixed(4)}
                            </TableCell>
                          )}

                          {/* Display parameters */}
                          {parameterNames.slice(0, 2).map(name => (
                            <TableCell key={name}>
                              {typeof measurement.parameters[name] === "number"
                                ? parseFloat(
                                    measurement.parameters[name]
                                  ).toFixed(2)
                                : String(measurement.parameters[name])}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                measurement.isRecommended
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {measurement.isRecommended ? "API" : "Manual"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                  <FileCog className="mb-4 size-16 opacity-30" />
                  <p>No measurement data available yet.</p>
                  <p className="text-sm">Run experiments to get started.</p>
                  <Button className="mt-4" asChild>
                    <Link
                      href={`/dashboard/optimizations/${optimization.id}/run`}
                    >
                      <Beaker className="mr-2 size-4" />
                      Run Experiments
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements Tab Content */}
        <TabsContent value="measurements">
          {/* Measurements Table (full) */}
          <Card>
            <CardHeader>
              <CardTitle>All Measurements</CardTitle>
              <CardDescription>
                Complete history of experimental results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="rounded-md border">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="bg-background sticky top-0">
                        <TableRow>
                          <TableHead className="w-[80px]">Iteration</TableHead>
                          <TableHead>Date</TableHead>

                          {/* Show all target values */}
                          {targets.map(target => (
                            <TableHead key={target.name} className="text-right">
                              <div className="flex items-center justify-end">
                                {target.name}
                                {getTargetModeIcon(target.mode)}
                              </div>
                            </TableHead>
                          ))}

                          {/* Show all parameters */}
                          {parameterNames.map(name => (
                            <TableHead key={name}>{name}</TableHead>
                          ))}
                          <TableHead className="text-right">Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {measurements.map((measurement, index) => (
                          <TableRow key={measurement.id}>
                            <TableCell className="font-medium">
                              {measurements.length - index}
                            </TableCell>
                            <TableCell>
                              {new Date(measurement.createdAt).toLocaleString()}
                            </TableCell>

                            {/* Display all target values */}
                            {targets.map(target => (
                              <TableCell
                                key={target.name}
                                className="text-right font-medium"
                              >
                                {measurement.targetValues &&
                                measurement.targetValues[target.name]
                                  ? parseFloat(
                                      measurement.targetValues[target.name]
                                    ).toFixed(4)
                                  : target.name ===
                                      optimization.primaryTargetName
                                    ? parseFloat(
                                        measurement.targetValue
                                      ).toFixed(4)
                                    : "N/A"}
                              </TableCell>
                            ))}

                            {/* Display all parameters */}
                            {parameterNames.map(name => (
                              <TableCell key={name}>
                                {typeof measurement.parameters[name] ===
                                "number"
                                  ? parseFloat(
                                      measurement.parameters[name]
                                    ).toFixed(2)
                                  : String(measurement.parameters[name])}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  measurement.isRecommended
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {measurement.isRecommended ? "API" : "Manual"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                  <FileCog className="mb-4 size-16 opacity-30" />
                  <p>No measurement data available yet.</p>
                  <p className="text-sm">Run experiments to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab Content */}
        <TabsContent value="insights" className="space-y-6">
          {measurements.length >= 5 ? (
            <>
              {/* Multi-Target Visualization (on insights tab too) */}
              {isMultiTarget && (
                <MultiTargetVisualization
                  optimization={optimization}
                  measurements={measurements}
                />
              )}

              {/* Feature Importance */}
              <FeatureImportanceChart
                optimization={optimization}
                initialImportance={featureImportance}
              />

              {/* Prediction Surface */}
              <PredictionSurface optimization={optimization} />
            </>
          ) : (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Not enough data for insights</AlertTitle>
              <AlertDescription>
                Run at least 5 experiments to generate insights and
                visualizations.
                <div className="mt-4">
                  <Button asChild>
                    <Link
                      href={`/dashboard/optimizations/${optimization.id}/run`}
                    >
                      <Beaker className="mr-2 size-4" />
                      Run Experiments
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Configuration</CardTitle>
              <CardDescription>
                Details about how this optimization is configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border p-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium">Name</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        {optimization.name}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium">Status</dt>
                      <dd className="mt-1 capitalize">
                        <Badge
                          variant={
                            optimization.status === "active"
                              ? "default"
                              : "outline"
                          }
                        >
                          {optimization.status}
                        </Badge>
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium">Description</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        {optimization.description || "No description provided"}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium">Created</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        {new Date(optimization.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium">Last Updated</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        {new Date(optimization.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Targets Configuration */}
                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Target Configuration
                  </h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Weight</TableHead>
                          {isMultiTarget && (
                            <TableHead>
                              {optimization.objectiveType === "desirability"
                                ? "Weight"
                                : "Additional Info"}
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {targets.map(target => (
                          <TableRow key={target.name}>
                            <TableCell className="font-medium">
                              {target.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {target.mode}
                                {getTargetModeIcon(target.mode)}
                              </div>
                            </TableCell>
                            {target.mode === "MATCH" && (
                              <TableCell>
                                {target.bounds
                                  ? `${target.bounds[0]} to ${target.bounds[1]}`
                                  : "No bounds specified"}
                              </TableCell>
                            )}
                            {isMultiTarget && (
                              <TableCell>
                                {optimization.objectiveType ===
                                  "desirability" && target.weight
                                  ? target.weight
                                  : optimization.objectiveType === "pareto"
                                    ? "Pareto front"
                                    : "N/A"}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Parameter Configuration */}
                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Parameter Configuration
                  </h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Range/Values</TableHead>
                          <TableHead>Options</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {optimization.config.parameters.map(
                          (param: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {param.name}
                              </TableCell>
                              <TableCell>{param.type}</TableCell>
                              <TableCell>
                                {param.type === "NumericalContinuous" &&
                                param.bounds
                                  ? `${param.bounds[0]} to ${param.bounds[1]}`
                                  : param.type === "NumericalDiscrete" &&
                                      Array.isArray(param.values)
                                    ? param.values.join(", ")
                                    : param.type === "CategoricalParameter" &&
                                        Array.isArray(param.values)
                                      ? param.values.join(", ")
                                      : "Not specified"}
                              </TableCell>
                              <TableCell>
                                {param.type === "NumericalDiscrete" &&
                                param.tolerance
                                  ? `Tolerance: ${param.tolerance}`
                                  : param.type === "CategoricalParameter" &&
                                      param.encoding
                                    ? `Encoding: ${param.encoding}`
                                    : "None"}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Optimization Configuration */}
                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Recommender Configuration
                  </h3>
                  <div className="rounded-lg border p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium">
                          Recommender Type
                        </dt>
                        <dd className="text-muted-foreground mt-1 text-sm">
                          {optimization.recommenderType || "Default"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">
                          Acquisition Function
                        </dt>
                        <dd className="text-muted-foreground mt-1 text-sm">
                          {optimization.acquisitionFunction || "Default"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Objective Type</dt>
                        <dd className="text-muted-foreground mt-1 text-sm">
                          {optimization.objectiveType === "single"
                            ? "Single Target"
                            : optimization.objectiveType === "desirability"
                              ? "Desirability Function"
                              : optimization.objectiveType === "pareto"
                                ? "Pareto Optimization"
                                : "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Constraints</dt>
                        <dd className="text-muted-foreground mt-1 text-sm">
                          {optimization.hasConstraints
                            ? "Custom constraints defined"
                            : "No constraints"}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Configuration JSON */}
                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Advanced Configuration
                  </h3>
                  <div className="max-h-[300px] overflow-auto rounded-lg border">
                    <pre className="bg-slate-50 p-4 text-xs dark:bg-slate-900">
                      {JSON.stringify(optimization.config, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
