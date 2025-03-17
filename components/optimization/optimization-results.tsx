// components/optimization/optimization-results.tsx
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
import { Badge } from "@/components/ui/badge"
import {
  SelectOptimization,
  SelectMeasurement
} from "@/db/schema/optimizations-schema"
import { getBestPointWorkflowAction } from "@/actions/optimization-workflow-actions"
import { getMeasurementsAction } from "@/actions/db/optimizations-actions"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  Info,
  AlertCircle,
  BarChart,
  Beaker,
  MoveHorizontal
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"

interface OptimizationResultsProps {
  optimization: SelectOptimization
  measurements: SelectMeasurement[]
  initialBestPoint?: {
    best_parameters?: Record<string, any>
    best_value?: number
  }
}

export function OptimizationResults({
  optimization,
  measurements: initialMeasurements,
  initialBestPoint
}: OptimizationResultsProps) {
  const [bestPoint, setBestPoint] = useState(initialBestPoint)
  const [isLoadingBest, setIsLoadingBest] = useState(false)
  const [measurements, setMeasurements] = useState(initialMeasurements)
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [activeTargetName, setActiveTargetName] = useState<string>(
    optimization.primaryTargetName
  )

  // Get all target information from the optimization
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  // Refresh best point
  const refreshBestPoint = async () => {
    setIsLoadingBest(true)
    try {
      const result = await getBestPointWorkflowAction(optimization.optimizerId)
      if (result.isSuccess && result.data) {
        setBestPoint(result.data)
      }
    } catch (error) {
      console.error("Error refreshing best point:", error)
    } finally {
      setIsLoadingBest(false)
    }
  }

  // Refresh measurements
  const refreshMeasurements = async () => {
    setIsLoadingMeasurements(true)
    try {
      const result = await getMeasurementsAction(optimization.id)
      if (result.isSuccess && result.data) {
        setMeasurements(result.data)
      }
    } catch (error) {
      console.error("Error refreshing measurements:", error)
    } finally {
      setIsLoadingMeasurements(false)
    }
  }

  // Format chart data from measurements
  const formatChartData = () => {
    return measurements
      .map((measurement, index) => {
        // Create a base object with iteration info
        const baseObj: any = {
          iteration: measurements.length - index,
          formattedDate: new Date(measurement.createdAt).toLocaleString(),
          isRecommended: measurement.isRecommended
        }

        // Add parameters
        Object.entries(measurement.parameters).forEach(([key, value]) => {
          baseObj[`param_${key}`] = value
        })

        // Add target values
        if (measurement.targetValues) {
          // If we have the new targetValues structure, use that
          Object.entries(measurement.targetValues).forEach(
            ([targetName, value]) => {
              baseObj[targetName] = parseFloat(value)
            }
          )
        } else {
          // Fallback to the single targetValue
          baseObj[optimization.primaryTargetName] = parseFloat(
            measurement.targetValue
          )
        }

        return baseObj
      })
      .reverse() // Reverse to show in chronological order
  }

  // Calculate best values at each iteration for a specific target
  const calculateBestValues = (data: any[], targetName: string) => {
    // Find the target mode to determine if higher or lower is better
    const target = targets.find(t => t.name === targetName)
    const mode = target?.mode || "MAX"

    let bestValue = mode === "MAX" ? -Infinity : Infinity

    return data.map(point => {
      const value = point[targetName]

      if (mode === "MAX") {
        bestValue = Math.max(bestValue, value)
      } else if (mode === "MIN") {
        bestValue = Math.min(bestValue, value)
      } else {
        // For MATCH mode, we need the bounds to calculate best value
        // For now, just use the current value
        bestValue = value
      }

      return { ...point, [`best_${targetName}`]: bestValue }
    })
  }

  const chartData = formatChartData()
  const chartDataWithBest = calculateBestValues(chartData, activeTargetName)

  // Get parameter names
  const parameterNames = optimization.config.parameters.map(param => param.name)

  // Get target mode for the active target
  const getActiveTargetMode = () => {
    const target = targets.find(t => t.name === activeTargetName)
    return target?.mode || "MAX"
  }

  // Get target mode icon
  const getTargetModeIcon = (mode: string) => {
    switch (mode) {
      case "MAX":
        return <ArrowUp className="size-4 text-green-500" />
      case "MIN":
        return <ArrowDown className="size-4 text-red-500" />
      case "MATCH":
        return <MoveHorizontal className="size-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{optimization.name}</CardTitle>
              <CardDescription>
                Created{" "}
                {formatDistanceToNow(new Date(optimization.createdAt), {
                  addSuffix: true
                })}
              </CardDescription>
            </div>
            <Badge
              variant={optimization.status === "active" ? "default" : "outline"}
            >
              {optimization.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-muted-foreground">
            {optimization.description || "No description provided"}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{measurements.length}</div>
            <p className="text-muted-foreground text-xs">Measurements taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold capitalize">
              {optimization.status}
              {optimization.status === "active" && (
                <div className="ml-2 size-2 animate-pulse rounded-full bg-green-500"></div>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Last updated:{" "}
              {optimization.lastModelUpdate
                ? formatDistanceToNow(new Date(optimization.lastModelUpdate), {
                    addSuffix: true
                  })
                : "Never"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targets.length}</div>
            <p className="text-muted-foreground text-xs">
              {optimization.objectiveType === "single"
                ? "Single objective"
                : optimization.objectiveType === "desirability"
                  ? "Desirability function"
                  : "Pareto optimization"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {optimization.config.parameters.length}
            </div>
            <p className="text-muted-foreground text-xs">
              {optimization.hasConstraints
                ? "With constraints"
                : "No constraints"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Best Point Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Best Results</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshBestPoint}
                  disabled={isLoadingBest}
                >
                  {isLoadingBest ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Current best parameters and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bestPoint?.best_parameters ? (
                <>
                  {/* Best Parameters */}
                  <div className="mb-4 space-y-4">
                    <h3 className="text-lg font-medium">Best Parameters</h3>
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

                  {/* Best Target Value - For primary target when using single objective */}
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Best Value</h4>
                      <span className="flex items-center text-xl font-bold">
                        {bestPoint.best_value !== undefined
                          ? bestPoint.best_value.toFixed(4)
                          : "N/A"}
                        {getTargetModeIcon(getActiveTargetMode())}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="text-muted-foreground mb-4 size-16 opacity-30" />
                  <p className="text-muted-foreground">
                    No best point data available yet
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Add measurements to get started
                  </p>
                  <Button className="mt-4" onClick={refreshBestPoint}>
                    <RefreshCw className="mr-2 size-4" />
                    Refresh Best Point
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Selection for Charts */}
          <div className="rounded-md border p-4">
            <h3 className="mb-4 text-lg font-medium">
              Select Target for Visualization
            </h3>
            <div className="flex flex-wrap gap-2">
              {targets.map(target => (
                <Button
                  key={target.name}
                  variant={
                    activeTargetName === target.name ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveTargetName(target.name)}
                  className="flex items-center"
                >
                  {target.name}
                  {getTargetModeIcon(target.mode)}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Optimization Progress</CardTitle>
                  <CardDescription>
                    {activeTargetName} values over time
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Shows the progression of target values over iterations.
                      </p>
                      <p>Blue line shows individual measurements.</p>
                      <p>Green line shows the best value achieved.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartDataWithBest}
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
                          value: activeTargetName,
                          angle: -90,
                          position: "insideLeft"
                        }}
                      />
                      <RechartTooltip
                        formatter={(value: number, name: string) => {
                          if (name === activeTargetName) {
                            return [value.toFixed(4), activeTargetName]
                          } else if (name === `best_${activeTargetName}`) {
                            return [
                              value.toFixed(4),
                              `Best ${activeTargetName}`
                            ]
                          }
                          return [value, name]
                        }}
                        labelFormatter={value => `Iteration ${value}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={activeTargetName}
                        stroke="#8884d8"
                        name={activeTargetName}
                        activeDot={{ r: 8 }}
                        isAnimationActive={true}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey={`best_${activeTargetName}`}
                        stroke="#82ca9d"
                        name={`Best ${activeTargetName}`}
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart className="text-muted-foreground mb-4 size-16 opacity-30" />
                  <p className="text-muted-foreground">No data available yet</p>
                  <p className="text-muted-foreground text-sm">
                    Add measurements to see progress
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Measurements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Measurements</CardTitle>
                  <CardDescription>Latest experimental results</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMeasurements}
                  disabled={isLoadingMeasurements}
                >
                  {isLoadingMeasurements ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
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
                        {/* Show parameters (limit to first 2 to avoid overcrowding) */}
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
                                : target.name === optimization.primaryTargetName
                                  ? parseFloat(measurement.targetValue).toFixed(
                                      4
                                    )
                                  : "N/A"}
                            </TableCell>
                          ))}
                          {/* Display first 2 parameters */}
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
                <div className="flex flex-col items-center justify-center py-12">
                  <Beaker className="text-muted-foreground mb-4 size-16 opacity-30" />
                  <p className="text-muted-foreground">No measurements yet</p>
                  <p className="text-muted-foreground text-sm">
                    Run experiments to get started
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActiveTab("measurements")}
              >
                View All Measurements
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Measurements</CardTitle>
                  <CardDescription>
                    Complete history of experimental results
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMeasurements}
                  disabled={isLoadingMeasurements}
                >
                  {isLoadingMeasurements ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Refresh
                </Button>
              </div>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <Beaker className="text-muted-foreground mb-4 size-16 opacity-30" />
                  <p className="text-muted-foreground">No measurements yet</p>
                  <p className="text-muted-foreground text-sm">
                    Run experiments to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
