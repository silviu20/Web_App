// components/optimization/optimization-results.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SelectOptimization,
  SelectMeasurement
} from "@/db/schema/optimizations-schema"
import { ArrowUp, ArrowDown, RefreshCw, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table"
import { getBestPointWorkflowAction } from "@/actions/optimization-workflow-actions"
import { toast } from "@/components/ui/use-toast"

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
  measurements,
  initialBestPoint
}: OptimizationResultsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoadingBest, setIsLoadingBest] = useState(false)
  const [bestPoint, setBestPoint] = useState(initialBestPoint || {})

  // Format chart data from measurements
  const formatChartData = useCallback(() => {
    return measurements.map((measurement, index) => ({
      iteration: index + 1,
      targetValue: parseFloat(measurement.targetValue),
      timestamp: new Date(measurement.createdAt).getTime(),
      formattedDate: new Date(measurement.createdAt).toLocaleString(),
      isRecommended: measurement.isRecommended,
      ...measurement.parameters
    }))
  }, [measurements])

  // Calculate best values at each iteration
  const calculateBestValues = useCallback(
    (data: any[]) => {
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
    },
    [optimization.targetMode]
  )

  const chartData = calculateBestValues(formatChartData())

  // Get parameter names
  const parameterNames = optimization.config?.parameters
    ? optimization.config.parameters.map((p: any) => p.name)
    : []

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

  // Update best point if initialBestPoint changes
  useEffect(() => {
    if (initialBestPoint) {
      setBestPoint(initialBestPoint)
    }
  }, [initialBestPoint])

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{optimization.name}</h1>
          <p className="text-muted-foreground text-sm">
            {optimization.description || "No description provided"}
          </p>
          <div className="mt-2">
            <Badge
              variant={optimization.status === "active" ? "default" : "outline"}
            >
              {optimization.status}
            </Badge>
            <Badge variant="outline" className="ml-2">
              Created{" "}
              {formatDistanceToNow(new Date(optimization.createdAt), {
                addSuffix: true
              })}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Measurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{measurements.length}</div>
                <p className="text-muted-foreground text-xs">
                  Total experiments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-2xl font-bold">
                  {optimization.targetName}
                  {optimization.targetMode === "MAX" ? (
                    <ArrowUp className="ml-1 size-5 text-green-500" />
                  ) : (
                    <ArrowDown className="ml-1 size-5 text-red-500" />
                  )}
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
                  Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parameterNames.length}
                </div>
                <p className="text-muted-foreground text-xs">
                  Optimization parameters
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Best Value
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

          {/* Best point card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Best Result</CardTitle>
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
                          <ArrowDown className="ml-1 inline-block size-5 text-red-500" />
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
                <div className="text-muted-foreground flex items-center justify-center py-8">
                  <p>No measurements recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress chart */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Progress</CardTitle>
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
                      />
                      <Line
                        type="monotone"
                        dataKey="bestValue"
                        stroke="#82ca9d"
                        name={`Best ${optimization.targetName}`}
                        strokeWidth={2}
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
                <div className="text-muted-foreground flex items-center justify-center py-12">
                  <p>No measurements recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent measurements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Measurements</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("measurements")}
              >
                View All
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">
                          {optimization.targetName}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {measurements.slice(0, 5).map(measurement => (
                        <TableRow key={measurement.id}>
                          <TableCell className="font-medium">
                            {measurement.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {new Date(measurement.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {parseFloat(measurement.targetValue).toFixed(4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground flex items-center justify-center py-8">
                  <p>No measurements recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements tab */}
        <TabsContent value="measurements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="rounded-md border">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-950">
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
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
                        {measurements.map(measurement => (
                          <TableRow key={measurement.id}>
                            <TableCell className="font-medium">
                              {measurement.id.slice(0, 8)}
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
                <div className="text-muted-foreground flex items-center justify-center py-12">
                  <p>No measurements recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters tab */}
        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Values/Bounds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimization.config?.parameters?.map(
                    (param: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {param.name}
                        </TableCell>
                        <TableCell>{param.type}</TableCell>
                        <TableCell>
                          {param.values
                            ? param.values.join(", ")
                            : param.bounds
                              ? `[${param.bounds[0]}, ${param.bounds[1]}]`
                              : "N/A"}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {optimization.config?.constraints &&
            optimization.config.constraints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Type</TableHead>
                        <TableHead>Parameters</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {optimization.config.constraints.map(
                        (constraint: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {constraint.type}
                            </TableCell>
                            <TableCell>
                              {constraint.parameters?.join(", ") || "N/A"}
                            </TableCell>
                            <TableCell>
                              {constraint.description || "No details available"}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
