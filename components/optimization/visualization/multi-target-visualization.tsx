// components/optimization/visualization/multi-target-visualization.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  SelectOptimization,
  SelectMeasurement
} from "@/db/schema/optimizations-schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  ZAxis
} from "recharts"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts"
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface MultiTargetVisualizationProps {
  optimization: SelectOptimization
  measurements: SelectMeasurement[]
}

export function MultiTargetVisualization({
  optimization,
  measurements
}: MultiTargetVisualizationProps) {
  const [activeTab, setActiveTab] = useState("pareto")
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])

  // Get all target information from the optimization
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  // Check if this is really a multi-target optimization
  const isMultiTarget = targets.length > 1

  // Initialize selected targets on first render
  useEffect(() => {
    if (targets.length >= 2) {
      setSelectedTargets([targets[0].name, targets[1].name])
    }
  }, [targets])

  // Format measurement data for visualization
  const formatMeasurementData = () => {
    return measurements.map((measurement, index) => {
      const formattedData: any = {
        id: index,
        iteration: index + 1,
        date: new Date(measurement.createdAt).toLocaleString(),
        isRecommended: measurement.isRecommended
      }

      // Add target values
      if (measurement.targetValues) {
        // If we have the new targetValues structure, use that
        Object.entries(measurement.targetValues).forEach(
          ([targetName, value]) => {
            // Normalize values based on target mode
            const target = targets.find(t => t.name === targetName)
            const targetValue = parseFloat(value)

            // Store both raw and normalized values
            formattedData[targetName] = targetValue

            // For normalization, invert values for MIN objectives so higher is always better
            if (target?.mode === "MIN") {
              // Invert the value but preserve the sign
              formattedData[`${targetName}_normalized`] = -targetValue
            } else if (target?.mode === "MATCH" && target.bounds) {
              // For MATCH objectives, calculate how close we are to the target range
              const [min, max] = target.bounds
              const midpoint = (min + max) / 2
              const distance = Math.abs(targetValue - midpoint)
              const maxDistance = Math.max(
                Math.abs(max - midpoint),
                Math.abs(min - midpoint)
              )

              // Normalize to 0-1 range where 1 is perfect match
              formattedData[`${targetName}_normalized`] =
                1 - Math.min(distance / maxDistance, 1)
            } else {
              // For MAX objectives, use as is
              formattedData[`${targetName}_normalized`] = targetValue
            }
          }
        )
      } else {
        // Fallback to the single targetValue
        const targetName = optimization.primaryTargetName
        const targetValue = parseFloat(measurement.targetValue)
        formattedData[targetName] = targetValue

        // Normalize based on mode
        if (optimization.primaryTargetMode === "MIN") {
          formattedData[`${targetName}_normalized`] = -targetValue
        } else {
          formattedData[`${targetName}_normalized`] = targetValue
        }
      }

      return formattedData
    })
  }

  const measurementData = formatMeasurementData()

  // Find Pareto-optimal points
  const findParetoPoints = (data: any[], target1: string, target2: string) => {
    // Clone the data to avoid modifying the original
    const clonedData = [...data]

    // Sort the data by the first target (descending)
    clonedData.sort((a, b) => {
      const aVal1 = a[`${target1}_normalized`]
      const bVal1 = b[`${target1}_normalized`]
      return bVal1 - aVal1
    })

    // Find Pareto-optimal points
    const paretoPoints: any[] = []
    let currentBest = -Infinity

    for (const point of clonedData) {
      const val2 = point[`${target2}_normalized`]

      if (val2 > currentBest) {
        paretoPoints.push(point)
        currentBest = val2
      }
    }

    // Mark points as Pareto-optimal
    const markedData = data.map(point => {
      const isParetoOptimal = paretoPoints.some(p => p.id === point.id)
      return { ...point, isParetoOptimal }
    })

    return markedData
  }

  // Function to prepare data for the radar chart
  const prepareRadarData = (data: any[]) => {
    if (data.length === 0 || targets.length < 3) return []

    // Get the best measurement for each target
    const bestPoints: Record<string, any> = {}
    const worstPoints: Record<string, any> = {}

    targets.forEach(target => {
      const targetName = target.name

      if (target.mode === "MAX") {
        bestPoints[targetName] = Math.max(...data.map(p => p[targetName]))
        worstPoints[targetName] = Math.min(...data.map(p => p[targetName]))
      } else if (target.mode === "MIN") {
        bestPoints[targetName] = Math.min(...data.map(p => p[targetName]))
        worstPoints[targetName] = Math.max(...data.map(p => p[targetName]))
      } else if (target.mode === "MATCH" && target.bounds) {
        // For MATCH, the best is the midpoint of the bounds
        const [min, max] = target.bounds
        const midpoint = (min + max) / 2
        bestPoints[targetName] = midpoint

        // Worst is the furthest possible value from the midpoint within the dataset
        const distances = data.map(p => Math.abs(p[targetName] - midpoint))
        const maxDistance = Math.max(...distances)
        worstPoints[targetName] =
          distances.indexOf(maxDistance) >= 0
            ? data[distances.indexOf(maxDistance)][targetName]
            : midpoint + maxDistance
      }
    })

    // Normalize all points to 0-100 scale for the radar chart
    const normalizeValue = (value: number, target: string) => {
      const best = bestPoints[target]
      const worst = worstPoints[target]

      if (best === worst) return 50 // Avoid division by zero

      const targetObj = targets.find(t => t.name === target)

      if (targetObj?.mode === "MAX") {
        return ((value - worst) / (best - worst)) * 100
      } else if (targetObj?.mode === "MIN") {
        return ((best - value) / (best - worst)) * 100
      } else if (targetObj?.mode === "MATCH" && targetObj.bounds) {
        const [min, max] = targetObj.bounds
        const midpoint = (min + max) / 2
        const distance = Math.abs(value - midpoint)
        const maxPossibleDistance = Math.max(
          Math.abs(worst - midpoint),
          Math.abs(best - midpoint)
        )

        return (1 - distance / maxPossibleDistance) * 100
      }

      return 0
    }

    // Take the latest 3 measurements and the best measurement for each target
    const latestPoints = data.slice(-3)

    // Find the best overall measurement (highest average normalized score)
    const bestOverallIndex = data.reduce((bestIdx, point, idx, arr) => {
      const currentScore =
        targets.reduce((sum, target) => {
          return sum + normalizeValue(point[target.name], target.name)
        }, 0) / targets.length

      const bestScore =
        targets.reduce((sum, target) => {
          return sum + normalizeValue(arr[bestIdx][target.name], target.name)
        }, 0) / targets.length

      return currentScore > bestScore ? idx : bestIdx
    }, 0)

    const bestOverallPoint = data[bestOverallIndex]

    // Create radar chart data
    const radarData = targets.map(target => {
      const result: Record<string, any> = {
        subject: target.name
      }

      // Add latest points
      latestPoints.forEach((point, idx) => {
        result[`Latest ${idx + 1}`] = normalizeValue(
          point[target.name],
          target.name
        )
      })

      // Add best point
      result.Best = normalizeValue(bestOverallPoint[target.name], target.name)

      return result
    })

    return radarData
  }

  // Get Pareto data if two targets are selected
  const paretoData =
    selectedTargets.length === 2
      ? findParetoPoints(
          measurementData,
          selectedTargets[0],
          selectedTargets[1]
        )
      : []

  // Get radar data for 3+ targets
  const radarData = prepareRadarData(measurementData)

  // Target selection handler
  const handleTargetSelection = (targetName: string) => {
    setSelectedTargets(prev => {
      if (prev.includes(targetName)) {
        // Remove target if already selected
        return prev.filter(t => t !== targetName)
      } else if (prev.length < 2) {
        // Add target if less than 2 are selected
        return [...prev, targetName]
      } else {
        // Replace first target if 2 are already selected
        return [targetName, prev[1]]
      }
    })
  }

  // Helper to get target mode display
  const getTargetModeDisplay = (mode: string) => {
    switch (mode) {
      case "MAX":
        return "(Maximize)"
      case "MIN":
        return "(Minimize)"
      case "MATCH":
        return "(Match Target)"
      default:
        return ""
    }
  }

  // If not multi-target, show message
  if (!isMultiTarget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Target Analysis</CardTitle>
          <CardDescription>
            Visualize relationships between multiple optimization targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>Single Target Optimization</AlertTitle>
            <AlertDescription>
              This optimization has only one target (
              {optimization.primaryTargetName}). Multi-target visualization is
              only available for optimizations with multiple targets.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // If not enough data, show message
  if (measurements.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Target Analysis</CardTitle>
          <CardDescription>
            Visualize relationships between multiple optimization targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>Insufficient Data</AlertTitle>
            <AlertDescription>
              At least 3 measurements are required for multi-target
              visualization. You currently have {measurements.length}{" "}
              measurement{measurements.length !== 1 ? "s" : ""}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Target Analysis</CardTitle>
        <CardDescription>
          Visualize relationships between multiple optimization targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pareto">Pareto Front</TabsTrigger>
            <TabsTrigger value="radar">Target Radar</TabsTrigger>
          </TabsList>

          {/* Pareto Front Tab */}
          <TabsContent value="pareto">
            <div className="space-y-4">
              {/* Target Selection */}
              <div className="rounded-md border p-4">
                <div className="mb-2 flex items-center">
                  <h3 className="text-sm font-medium">Select Two Targets</h3>
                  <TooltipProvider>
                    <TooltipUI>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 size-5 p-0"
                        >
                          <Info className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Select two targets to visualize the trade-off between
                          them.
                        </p>
                        <p>
                          The Pareto front shows the set of non-dominated
                          solutions.
                        </p>
                      </TooltipContent>
                    </TooltipUI>
                  </TooltipProvider>
                </div>
                <div className="flex flex-wrap gap-2">
                  {targets.map(target => (
                    <Button
                      key={target.name}
                      variant={
                        selectedTargets.includes(target.name)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleTargetSelection(target.name)}
                    >
                      {target.name} {getTargetModeDisplay(target.mode)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Pareto Chart */}
              {selectedTargets.length === 2 ? (
                <div className="h-[500px] w-full rounded-md border p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        type="number"
                        dataKey={selectedTargets[0]}
                        name={selectedTargets[0]}
                        reversed={
                          targets.find(t => t.name === selectedTargets[0])
                            ?.mode === "MIN"
                        }
                      >
                        <Label
                          value={`${selectedTargets[0]} ${getTargetModeDisplay(
                            targets.find(t => t.name === selectedTargets[0])
                              ?.mode || "MAX"
                          )}`}
                          position="bottom"
                          offset={20}
                        />
                      </XAxis>
                      <YAxis
                        type="number"
                        dataKey={selectedTargets[1]}
                        name={selectedTargets[1]}
                        reversed={
                          targets.find(t => t.name === selectedTargets[1])
                            ?.mode === "MIN"
                        }
                      >
                        <Label
                          value={`${selectedTargets[1]} ${getTargetModeDisplay(
                            targets.find(t => t.name === selectedTargets[1])
                              ?.mode || "MAX"
                          )}`}
                          angle={-90}
                          position="left"
                          offset={-40}
                        />
                      </YAxis>
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === "z") return ["", ""]
                          return [value.toFixed(4), name]
                        }}
                        labelFormatter={value => {
                          const point = paretoData.find(p => p.id === value)
                          return `Iteration ${point?.iteration} (${point?.date})`
                        }}
                      />
                      <Legend />
                      <Scatter
                        name="Regular Points"
                        data={paretoData.filter(p => !p.isParetoOptimal)}
                        fill="#8884d8"
                      />
                      <Scatter
                        name="Pareto Optimal"
                        data={paretoData.filter(p => p.isParetoOptimal)}
                        fill="#82ca9d"
                        shape="star"
                        line={{ type: "dashed", stroke: "#82ca9d" }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-md border">
                  <p className="text-muted-foreground">
                    Please select exactly two targets to visualize
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Radar Chart Tab */}
          <TabsContent value="radar">
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="mb-2 flex items-center">
                  <h3 className="text-sm font-medium">Target Radar Chart</h3>
                  <TooltipProvider>
                    <TooltipUI>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 size-5 p-0"
                        >
                          <Info className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          The radar chart shows normalized performance across
                          all targets.
                        </p>
                        <p>
                          Higher values (further from center) are better for all
                          targets, regardless of original optimization
                          direction.
                        </p>
                        <p>
                          100% means the best observed value for that target.
                        </p>
                      </TooltipContent>
                    </TooltipUI>
                  </TooltipProvider>
                </div>

                {targets.length >= 3 ? (
                  <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        data={radarData}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Tooltip
                          formatter={(value: any) => [
                            value.toFixed(1) + "%",
                            "Performance"
                          ]}
                        />
                        <Radar
                          name="Latest 1"
                          dataKey="Latest 1"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Latest 2"
                          dataKey="Latest 2"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Latest 3"
                          dataKey="Latest 3"
                          stroke="#ffc658"
                          fill="#ffc658"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Best Overall"
                          dataKey="Best"
                          stroke="#ff8042"
                          fill="#ff8042"
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center rounded-md border">
                    <p className="text-muted-foreground">
                      Radar chart requires at least 3 targets. This optimization
                      has {targets.length} targets.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
