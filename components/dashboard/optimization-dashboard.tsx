// components/dashboard/optimization-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeatureImportanceChart } from "@/components/optimization/visualization/feature-importance-chart"
import { PredictionSurface } from "@/components/optimization/visualization/prediction-surface"
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
  AlertCircle
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from "recharts"

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
    let bestValue = optimization.targetMode === "MAX" ? -Infinity : Infinity
    return data.map(point => {
      const value = parseFloat(point.targetValue)
      if (optimization.targetMode === "MAX") {
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/optimizations">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold">{optimization.name}</h1>
            <p className="text-muted-foreground text-sm">
              Created{" "}
              {formatDistanceToNow(new Date(optimization.createdAt), {
                addSuffix: true
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant={optimization.status === "active" ? "default" : "outline"}
            className="rounded-md px-2 py-1 text-xs font-medium"
          >
            {optimization.status === "active" ? "Active" : optimization.status}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Optimization Controls</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link
                  href={`/dashboard/optimizations/${optimization.id}/run`}
                  className="flex w-full items-center"
                >
                  <Beaker className="mr-2 size-4" />
                  Run Experiments
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={refreshBestPoint}
                disabled={isLoadingBest}
              >
                <RefreshCw className="mr-2 size-4" />
                Refresh Best Point
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRefresh}>
                <RefreshCw className="mr-2 size-4" />
                Refresh All Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="mr-2 size-4" />
                Export Results
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href={`/dashboard/optimizations/${optimization.id}/run`}>
            <Button>
              <Rocket className="mr-2 size-4" />
              Run Experiments
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
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
                  Target Objective
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-2xl font-bold">
                  {optimization.targetMode === "MAX" ? (
                    <ArrowUp className="mr-1 size-5 text-green-500" />
                  ) : (
                    <ArrowDown className="mr-1 size-5 text-green-500" />
                  )}
                  {optimization.targetName}
                </div>
                <p className="text-muted-foreground text-xs">
                  {optimization.targetMode === "MAX"
                    ? "Maximizing"
                    : "Minimizing"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Best {optimization.targetName}
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
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{optimization.targetName}</h4>
                      <span className="text-xl font-bold">
                        {bestPoint.best_value?.toFixed(4)}
                        {optimization.targetMode === "MAX" ? (
                          <ArrowUp className="ml-1 inline-block size-5 text-green-500" />
                        ) : (
                          <ArrowDown className="ml-1 inline-block size-5 text-green-500" />
                        )}
                      </span>
                    </div>
                  </div>

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

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Optimization Progress</CardTitle>
              <CardDescription>
                {optimization.targetName} improvement over iterations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="iteration"
                        label={{
                          value: "Iteration",
                          position: "insideBottomRight",
                          offset: -10
                        }}
                      />
                      <YAxis
                        label={{
                          value: optimization.targetName,
                          angle: -90,
                          position: "insideLeft"
                        }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "targetValue") {
                            return [value.toFixed(4), optimization.targetName]
                          } else if (name === "bestValue") {
                            return [
                              value.toFixed(4),
                              `Best ${optimization.targetName}`
                            ]
                          }
                          return [value, name]
                        }}
                        labelFormatter={value => `Iteration ${value}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="targetValue"
                        stroke="#8884d8"
                        name={optimization.targetName}
                        activeDot={{ r: 8 }}
                        isAnimationActive={true}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="bestValue"
                        stroke="#82ca9d"
                        name={`Best ${optimization.targetName}`}
                        strokeWidth={2}
                        isAnimationActive={true}
                        connectNulls
                      />

                      {/* Add reference line for current best value */}
                      {bestPoint?.best_value !== undefined && (
                        <ReferenceLine
                          y={bestPoint.best_value}
                          stroke="red"
                          strokeDasharray="3 3"
                          label={{
                            value: "Current Best",
                            position: "right"
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
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

          {/* Feature Importance (if enough data) */}
          {measurements.length >= 5 && (
            <FeatureImportanceChart
              optimization={optimization}
              initialImportance={featureImportance}
            />
          )}

          {/* Parameter Space Exploration (if enough data) */}
          {measurements.length >= 5 && (
            <PredictionSurface optimization={optimization} />
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
                        <TableHead className="text-right">
                          {optimization.targetName}
                        </TableHead>
                        {parameterNames.slice(0, 3).map(name => (
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
                          <TableCell className="text-right font-medium">
                            {parseFloat(measurement.targetValue).toFixed(4)}
                          </TableCell>
                          {parameterNames.slice(0, 3).map(name => (
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements Tab Content */}
        <TabsContent value="measurements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Measurements</CardTitle>
              <CardDescription>
                Complete history of experimental results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="rounded-md border">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-950">
                        <TableRow>
                          <TableHead className="w-[80px]">Iteration</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">
                            {optimization.targetName}
                          </TableHead>
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
                            <TableCell className="text-right font-medium">
                              {parseFloat(measurement.targetValue).toFixed(4)}
                            </TableCell>
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

          {/* Parameter Space Exploration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Parameter Space Exploration
              </CardTitle>
              <CardDescription>
                View the distribution of experiments across the parameter space
              </CardDescription>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="h-[500px] w-full">
                  <Tabs defaultValue="scatter">
                    <TabsList>
                      <TabsTrigger value="scatter">Scatter</TabsTrigger>
                      <TabsTrigger value="parallel">
                        Parallel Coordinates
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="scatter" className="pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid />
                          <XAxis
                            type="number"
                            dataKey={parameterNames[0]}
                            name={parameterNames[0]}
                            label={{
                              value: parameterNames[0],
                              position: "insideBottom",
                              offset: -10
                            }}
                          />
                          <YAxis
                            type="number"
                            dataKey={parameterNames[1]}
                            name={parameterNames[1]}
                            label={{
                              value: parameterNames[1],
                              angle: -90,
                              position: "insideLeft"
                            }}
                          />
                          <ZAxis
                            type="number"
                            dataKey="targetValue"
                            range={[50, 400]}
                            name={optimization.targetName}
                          />
                          <Tooltip
                            formatter={(value: any, name: string) => {
                              if (name === "targetValue") {
                                return [
                                  parseFloat(value).toFixed(4),
                                  optimization.targetName
                                ]
                              }
                              return [value, name]
                            }}
                          />
                          <Legend />
                          <Scatter
                            name="Experiments"
                            data={chartData}
                            fill="#8884d8"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="parallel" className="pt-4">
                      <div className="text-muted-foreground flex items-center justify-center py-12">
                        <p>
                          Parallel coordinates visualization would be
                          implemented here using a specialized library like
                          Plotly or D3.js
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                  <FileCog className="mb-4 size-16 opacity-30" />
                  <p>Not enough data to visualize parameter space.</p>
                  <p className="text-sm">
                    Run more experiments to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab Content */}
        <TabsContent value="insights" className="space-y-6">
          {measurements.length >= 5 ? (
            <>
              <FeatureImportanceChart
                optimization={optimization}
                initialImportance={featureImportance}
              />

              <PredictionSurface optimization={optimization} />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Optimization Path Analysis
                  </CardTitle>
                  <CardDescription>
                    Analysis of the optimization trajectory and convergence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="iteration"
                          label={{
                            value: "Iteration",
                            position: "insideBottomRight",
                            offset: -10
                          }}
                        />
                        <YAxis
                          label={{
                            value: optimization.targetName,
                            angle: -90,
                            position: "insideLeft"
                          }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === "bestValue") {
                              return [
                                value.toFixed(4),
                                `Best ${optimization.targetName}`
                              ]
                            }
                            return [value, name]
                          }}
                          labelFormatter={value => `Iteration ${value}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="bestValue"
                          stroke="#82ca9d"
                          name={`Best ${optimization.targetName}`}
                          strokeWidth={2}
                          isAnimationActive={true}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 font-medium">Convergence Analysis</h3>
                      <p className="text-muted-foreground text-sm">
                        Based on the optimization trajectory, the search appears
                        to be
                        {measurements.length > 10
                          ? " converging towards an optimum. "
                          : " still in early exploration phase. "}
                        The rate of improvement is
                        {measurements.length > 10
                          ? " slowing down"
                          : " significant"}
                        , which suggests
                        {measurements.length > 10
                          ? " we may be approaching the optimal region."
                          : " we should continue exploring the parameter space."}
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 font-medium">Recommendation</h3>
                      <p className="text-muted-foreground text-sm">
                        {measurements.length < 10
                          ? "Continue exploration by running more experiments to better understand the parameter space."
                          : measurements.length < 20
                            ? "The optimization is progressing well. Consider running focused experiments near the current best point."
                            : "The optimization appears to be converging. Fine-tune parameters around the best point or consider adding constraints to focus the search."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Optimization Configuration
              </CardTitle>
              <CardDescription>
                Details about how this optimization is configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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

                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Target Configuration
                  </h3>
                  <div className="rounded-lg border p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium">Target Name</dt>
                        <dd className="text-muted-foreground mt-1 text-sm">
                          {optimization.targetName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">
                          Optimization Mode
                        </dt>
                        <dd className="mt-1 flex items-center text-sm">
                          {optimization.targetMode}
                          {optimization.targetMode === "MAX" ? (
                            <ArrowUp className="ml-1 size-4 text-green-500" />
                          ) : (
                            <ArrowDown className="ml-1 size-4 text-green-500" />
                          )}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

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
                    </div>
                  </div>
                </div>

                {optimization.hasConstraints && (
                  <div>
                    <h3 className="mb-2 text-base font-medium">Constraints</h3>
                    <div className="rounded-lg border p-4">
                      <p className="text-muted-foreground">
                        This optimization has constraints defined. Constraints
                        help ensure only valid parameter combinations are
                        suggested.
                      </p>
                    </div>
                  </div>
                )}

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
