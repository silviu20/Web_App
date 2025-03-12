// components/optimization/optimization-results.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { getBestPointWorkflowAction } from "@/actions/optimization-workflow-actions"
import { getMeasurementsAction } from "@/actions/db/optimizations-actions"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Beaker,
  Trophy,
  History,
  ChevronRight,
  Download,
  RotateCw
} from "lucide-react"
import {
  SelectMeasurement,
  SelectOptimization
} from "@/db/schema/optimizations-schema"
import { ParameterImpactChart } from "@/components/optimization/parameter-impact-chart"

// Helper function to format data for the chart
const formatChartData = (measurements: SelectMeasurement[]) => {
  return measurements.map((measurement, index) => ({
    iteration: index + 1,
    targetValue: parseFloat(measurement.targetValue),
    isRecommended: measurement.isRecommended,
    parameters: measurement.parameters,
    timestamp: measurement.createdAt
  }))
}

// Helper function to calculate best values at each iteration
const calculateBestValues = (chartData: any[], mode: "MAX" | "MIN") => {
  let bestValue = mode === "MAX" ? -Infinity : Infinity
  return chartData.map(point => {
    const value = parseFloat(point.targetValue)
    if (mode === "MAX") {
      bestValue = Math.max(bestValue, value)
    } else {
      bestValue = Math.min(bestValue, value)
    }
    return { ...point, bestValue }
  })
}

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
  const router = useRouter()
  const [measurements, setMeasurements] =
    useState<SelectMeasurement[]>(initialMeasurements)
  const [bestPoint, setBestPoint] = useState(initialBestPoint || {})
  const [isLoadingBest, setIsLoadingBest] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const refreshBestPoint = async () => {
    setIsLoadingBest(true)
    try {
      const result = await getBestPointWorkflowAction(optimization.optimizerId)
      if (result.isSuccess && result.data) {
        setBestPoint(result.data)
      } else {
        toast({
          title: "Error loading best point",
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

  const refreshMeasurements = async () => {
    setIsLoadingHistory(true)
    try {
      const result = await getMeasurementsAction(optimization.id)
      if (result.isSuccess && result.data) {
        setMeasurements(result.data)
      } else {
        toast({
          title: "Error loading measurements",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error refreshing measurements:", error)
      toast({
        title: "Error",
        description: "Failed to refresh measurements history",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Prepare chart data
  const chartData = calculateBestValues(
    formatChartData(measurements),
    optimization.targetMode
  )

  // Determine the parameter names from the configuration
  const parameterNames = optimization.config.parameters.map(param => param.name)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold">{optimization.name}</h2>
        <TabsList className="mt-4 sm:mt-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        {/* Best Point Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center text-lg">
                <Trophy className="mr-2 size-5 text-yellow-500" />
                Best Result
              </CardTitle>
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
                <RotateCw className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {bestPoint.best_parameters ? (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{optimization.targetName}</h4>
                    <span className="flex items-center text-xl font-bold">
                      {bestPoint.best_value?.toFixed(4)}
                      {optimization.targetMode === "MAX" ? (
                        <ArrowUp className="ml-1 size-5 text-green-500" />
                      ) : (
                        <ArrowDown className="ml-1 size-5 text-green-500" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Best Parameters:</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {Object.entries(bestPoint.best_parameters).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="bg-card rounded-md border p-3"
                        >
                          <div className="text-sm font-medium">{key}</div>
                          <div className="mt-1 text-sm">
                            {typeof value === "number"
                              ? value.toFixed(value % 1 === 0 ? 0 : 2)
                              : String(value)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                {isLoadingBest ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="mb-2 size-8 animate-spin" />
                    <p>Loading best point...</p>
                  </div>
                ) : (
                  <p>
                    No best point available yet. Add measurements to get
                    started.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimization Progress</CardTitle>
            <CardDescription>
              Target value improvement over iterations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="iteration"
                      label={{
                        value: "Iteration",
                        position: "insideBottom",
                        offset: -5
                      }}
                    />
                    <YAxis
                      label={{
                        value: optimization.targetName,
                        angle: -90,
                        position: "insideLeft"
                      }}
                    />
                    <Tooltip />
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
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <p>No measurement data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parameter Impact Analysis */}
        {measurements.length > 0 && (
          <ParameterImpactChart
            measurements={measurements}
            parameterNames={parameterNames}
            targetName={optimization.targetName}
            targetMode={optimization.targetMode}
          />
        )}

        {/* Summary Stats Card */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Measurements
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
            <CardContent className="flex items-center">
              <div className="text-2xl font-bold capitalize">
                {optimization.status}
              </div>
              <Badge
                variant={
                  optimization.status === "active" ? "default" : "outline"
                }
                className="ml-2"
              >
                {optimization.status === "active"
                  ? "Running"
                  : optimization.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Target Objective
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">
                  {optimization.targetMode}
                </div>
                {optimization.targetMode === "MAX" ? (
                  <ArrowUp className="ml-2 size-5 text-green-500" />
                ) : (
                  <ArrowDown className="ml-2 size-5 text-green-500" />
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {optimization.targetMode === "MAX"
                  ? "Maximizing"
                  : "Minimizing"}{" "}
                {optimization.targetName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground truncate text-sm font-medium">
                {optimization.optimizerId}
              </div>
              <p className="mt-2 text-xs">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() =>
                    router.push(
                      `/dashboard/optimizations/${optimization.id}/run`
                    )
                  }
                >
                  Run experiments <ChevronRight className="ml-1 size-3" />
                </Button>
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center text-lg">
                <History className="mr-2 size-5" />
                Measurement History
              </CardTitle>
              <CardDescription>
                All recorded measurements for this optimization
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMeasurements}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? (
                <RotateCw className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Refresh
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
                      {parameterNames.slice(0, 4).map(name => (
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
                        {parameterNames.slice(0, 4).map(name => (
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
                              measurement.isRecommended ? "default" : "outline"
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
              <div className="text-muted-foreground py-8 text-center">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="mb-2 size-8 animate-spin" />
                    <p>Loading measurement history...</p>
                  </div>
                ) : (
                  <p>No measurement history available yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="parameters" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Beaker className="mr-2 size-5" />
              Parameter Configuration
            </CardTitle>
            <CardDescription>
              Parameters being optimized in this experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Values/Range</TableHead>
                      <TableHead className="text-right">Options</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimization.config.parameters.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {param.name}
                        </TableCell>
                        <TableCell>{param.type}</TableCell>
                        <TableCell>
                          {param.type === "NumericalDiscrete" &&
                            Array.isArray(param.values) &&
                            param.values.join(", ")}
                          {param.type === "NumericalContinuous" &&
                            param.bounds &&
                            `${param.bounds[0]} to ${param.bounds[1]}`}
                          {param.type === "CategoricalParameter" &&
                            Array.isArray(param.values) &&
                            param.values.join(", ")}
                        </TableCell>
                        <TableCell className="text-right">
                          {param.type === "NumericalDiscrete" &&
                            param.tolerance &&
                            `Tolerance: ${param.tolerance}`}
                          {param.type === "CategoricalParameter" &&
                            param.encoding &&
                            `Encoding: ${param.encoding}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Target Configuration */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Target Configuration</h3>
                <div className="rounded-md border p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium">Target Name</h4>
                      <p className="text-muted-foreground">
                        {optimization.targetName}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Optimization Mode</h4>
                      <p className="text-muted-foreground flex items-center">
                        {optimization.targetMode}
                        {optimization.targetMode === "MAX" ? (
                          <ArrowUp className="ml-1 size-4 text-green-500" />
                        ) : (
                          <ArrowDown className="ml-1 size-4 text-green-500" />
                        )}
                      </p>
                    </div>
                    {optimization.config.target_config.bounds && (
                      <>
                        <div>
                          <h4 className="text-sm font-medium">Lower Bound</h4>
                          <p className="text-muted-foreground">
                            {optimization.config.target_config.bounds.lower !==
                            undefined
                              ? optimization.config.target_config.bounds.lower
                              : "None"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Upper Bound</h4>
                          <p className="text-muted-foreground">
                            {optimization.config.target_config.bounds.upper !==
                            undefined
                              ? optimization.config.target_config.bounds.upper
                              : "None"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommender Configuration */}
              {optimization.config.recommender_config && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    Recommender Configuration
                  </h3>
                  <div className="rounded-md border p-4">
                    <pre className="bg-muted overflow-auto rounded p-2 text-xs">
                      {JSON.stringify(
                        optimization.config.recommender_config,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* Constraints */}
              {optimization.config.constraints &&
                optimization.config.constraints.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Constraints</h3>
                    <div className="rounded-md border p-4">
                      <pre className="bg-muted overflow-auto rounded p-2 text-xs">
                        {JSON.stringify(
                          optimization.config.constraints,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
