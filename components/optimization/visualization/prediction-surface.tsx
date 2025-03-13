// components/optimization/visualization/prediction-surface.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPredictionsWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import {
  RefreshCw,
  Map,
  RotateCw,
  AlertTriangle,
  BarChart4
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Surface,
  Contour
} from "recharts"

interface PredictionSurfaceProps {
  optimization: SelectOptimization
}

export function PredictionSurface({ optimization }: PredictionSurfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [visualizationType, setVisualizationType] = useState<
    "3d" | "contour" | "heatmap"
  >("contour")
  const [xParam, setXParam] = useState<string>("")
  const [yParam, setYParam] = useState<string>("")
  const [otherParams, setOtherParams] = useState<Record<string, any>>({})
  const [predictionData, setPredictionData] = useState<any[]>([])

  // Extract parameter information from optimization config
  const parameters = optimization.config.parameters || []
  const parameterNames = parameters.map(p => p.name)

  // Initialize selected parameters when component mounts
  useEffect(() => {
    if (parameterNames.length >= 2) {
      setXParam(parameterNames[0])
      setYParam(parameterNames[1])

      // Initialize other parameters with default values
      const initialOtherParams: Record<string, any> = {}
      parameters.forEach(param => {
        if (
          param.name !== parameterNames[0] &&
          param.name !== parameterNames[1]
        ) {
          if (param.type === "NumericalContinuous" && param.bounds) {
            // Use the middle of the range for continuous parameters
            initialOtherParams[param.name] =
              (param.bounds[0] + param.bounds[1]) / 2
          } else if (
            param.type === "NumericalDiscrete" &&
            Array.isArray(param.values)
          ) {
            // Use the first value for discrete parameters
            initialOtherParams[param.name] = param.values[0]
          } else if (
            param.type === "CategoricalParameter" &&
            Array.isArray(param.values)
          ) {
            // Use the first category for categorical parameters
            initialOtherParams[param.name] = param.values[0]
          }
        }
      })
      setOtherParams(initialOtherParams)
    }
  }, [parameterNames, parameters])

  // Generate grid points for the two selected parameters
  const generateGridPoints = () => {
    const xParamInfo = parameters.find(p => p.name === xParam)
    const yParamInfo = parameters.find(p => p.name === yParam)

    if (!xParamInfo || !yParamInfo) return []

    const getGridValues = (param: any) => {
      if (param.type === "NumericalContinuous" && param.bounds) {
        // Generate 10 equally spaced points for continuous parameters
        const [min, max] = param.bounds
        const step = (max - min) / 9
        return Array.from({ length: 10 }, (_, i) => min + i * step)
      } else if (
        param.type === "NumericalDiscrete" &&
        Array.isArray(param.values)
      ) {
        // Use the available discrete values
        return [...param.values]
      } else if (
        param.type === "CategoricalParameter" &&
        Array.isArray(param.values)
      ) {
        // Use categorical values (will need encoding)
        return [...param.values]
      }
      return []
    }

    const xValues = getGridValues(xParamInfo)
    const yValues = getGridValues(yParamInfo)

    // Create grid points
    const points: Record<string, any>[] = []
    for (const x of xValues) {
      for (const y of yValues) {
        const point = { ...otherParams }
        point[xParam] = x
        point[yParam] = y
        points.push(point)
      }
    }

    return points
  }

  // Fetch predictions for the grid points
  const fetchPredictions = async () => {
    if (!xParam || !yParam) {
      toast({
        title: "Parameters Required",
        description: "Please select both X and Y parameters",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const gridPoints = generateGridPoints()

      if (gridPoints.length === 0) {
        throw new Error("Failed to generate grid points")
      }

      const result = await getPredictionsWorkflowAction(
        optimization.optimizerId,
        gridPoints
      )

      if (result.isSuccess && result.data) {
        // Format prediction data for visualization
        const formattedData = gridPoints.map((point, index) => ({
          x: point[xParam],
          y: point[yParam],
          z: result.data[index]?.mean || 0,
          uncertainty: result.data[index]?.std || 0
        }))

        setPredictionData(formattedData)

        toast({
          title: "Predictions Updated",
          description: "The model predictions have been updated"
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching predictions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch predictions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format parameter label based on type
  const formatParamLabel = (param: any, value: any) => {
    if (
      param.type === "NumericalContinuous" ||
      param.type === "NumericalDiscrete"
    ) {
      return typeof value === "number" ? value.toFixed(2) : value
    }
    return value
  }

  // Get parameter info by name
  const getParamInfo = (name: string) => {
    return parameters.find(p => p.name === name)
  }

  // Update a parameter value in otherParams
  const updateParamValue = (name: string, value: any) => {
    setOtherParams(prev => ({ ...prev, [name]: value }))
  }

  // Check if we have data
  const hasData = predictionData.length > 0

  // Get the range for a parameter
  const getParamRange = (param: any) => {
    if (param.type === "NumericalContinuous" && param.bounds) {
      return param.bounds
    } else if (
      param.type === "NumericalDiscrete" &&
      Array.isArray(param.values)
    ) {
      return [Math.min(...param.values), Math.max(...param.values)]
    }
    return [0, 1] // Default range
  }

  // Format the tooltip value
  const formatTooltipValue = (value: any, name: string) => {
    if (name === "z") {
      return [value.toFixed(4), optimization.targetName]
    }
    return [value, name]
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Map className="mr-2 inline-block size-5" />
            Prediction Surface
          </CardTitle>
          <CardDescription>
            Visualize how parameter combinations affect the predicted outcome
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPredictions}
          disabled={isLoading}
        >
          {isLoading ? (
            <RotateCw className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Update Predictions
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Parameter Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="x-param">X Axis Parameter</Label>
                <Select
                  value={xParam}
                  onValueChange={setXParam}
                  disabled={isLoading}
                >
                  <SelectTrigger id="x-param">
                    <SelectValue placeholder="Select X parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.map(param => (
                      <SelectItem key={`x-${param.name}`} value={param.name}>
                        {param.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="y-param">Y Axis Parameter</Label>
                <Select
                  value={yParam}
                  onValueChange={setYParam}
                  disabled={isLoading}
                >
                  <SelectTrigger id="y-param">
                    <SelectValue placeholder="Select Y parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.map(param => (
                      <SelectItem key={`y-${param.name}`} value={param.name}>
                        {param.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Other Parameters Controls */}
            {parameterNames.length > 2 && (
              <div className="mt-4 space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-medium">Other Parameters</h4>
                <div className="space-y-3">
                  {parameterNames
                    .filter(name => name !== xParam && name !== yParam)
                    .map(name => {
                      const param = getParamInfo(name)
                      if (!param) return null

                      if (
                        param.type === "NumericalContinuous" ||
                        param.type === "NumericalDiscrete"
                      ) {
                        const [min, max] = getParamRange(param)
                        const step =
                          param.type === "NumericalDiscrete"
                            ? 1
                            : (max - min) / 100

                        return (
                          <div key={name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`param-${name}`}>{name}</Label>
                              <span className="text-muted-foreground text-sm">
                                {formatParamLabel(param, otherParams[name])}
                              </span>
                            </div>
                            <Slider
                              id={`param-${name}`}
                              min={min}
                              max={max}
                              step={step}
                              value={[otherParams[name] || min]}
                              onValueChange={values =>
                                updateParamValue(name, values[0])
                              }
                              disabled={isLoading}
                            />
                          </div>
                        )
                      } else if (
                        param.type === "CategoricalParameter" &&
                        Array.isArray(param.values)
                      ) {
                        return (
                          <div key={name} className="space-y-2">
                            <Label htmlFor={`param-${name}`}>{name}</Label>
                            <Select
                              value={String(otherParams[name])}
                              onValueChange={value =>
                                updateParamValue(name, value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger id={`param-${name}`}>
                                <SelectValue placeholder={`Select ${name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {param.values.map((val: any) => (
                                  <SelectItem
                                    key={`${name}-${val}`}
                                    value={String(val)}
                                  >
                                    {val}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      }

                      return null
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Visualization Tabs */}
          <Tabs
            value={visualizationType}
            onValueChange={value => setVisualizationType(value as any)}
          >
            <TabsList>
              <TabsTrigger value="contour">Contour</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="3d">3D Surface</TabsTrigger>
            </TabsList>

            <TabsContent value="contour" className="pt-4">
              {hasData ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name={xParam}
                        label={{
                          value: xParam,
                          position: "insideBottom",
                          offset: -10
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name={yParam}
                        label={{
                          value: yParam,
                          angle: -90,
                          position: "insideLeft"
                        }}
                      />
                      <ZAxis
                        type="number"
                        dataKey="z"
                        range={[0, 500]}
                        name={optimization.targetName}
                      />
                      <Tooltip formatter={formatTooltipValue} />
                      <Scatter
                        name={optimization.targetName}
                        data={predictionData}
                        fill="#8884d8"
                      />
                      {/* Contour lines could be added here in a real implementation */}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                  <div className="text-center">
                    <BarChart4 className="mx-auto mb-4 size-10 opacity-50" />
                    <p>
                      Select parameters and click "Update Predictions" to
                      generate the contour plot
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="heatmap" className="pt-4">
              {hasData ? (
                <div className="h-[400px] w-full">
                  {/* Heatmap visualization would go here */}
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="mx-auto mb-4 size-10 opacity-50" />
                      <p>
                        Heatmap visualization requires additional processing
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                  <div className="text-center">
                    <BarChart4 className="mx-auto mb-4 size-10 opacity-50" />
                    <p>
                      Select parameters and click "Update Predictions" to
                      generate the heatmap
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="3d" className="pt-4">
              {hasData ? (
                <div className="h-[400px] w-full">
                  {/* 3D Surface visualization would go here */}
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="mx-auto mb-4 size-10 opacity-50" />
                      <p>
                        3D visualization requires a specialized 3D plotting
                        library
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                  <div className="text-center">
                    <BarChart4 className="mx-auto mb-4 size-10 opacity-50" />
                    <p>
                      Select parameters and click "Update Predictions" to
                      generate the 3D surface
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Interpretation */}
          {hasData && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h4 className="mb-2 font-medium">Interpretation</h4>
              <p className="text-muted-foreground text-sm">
                This visualization shows how {xParam} and {yParam} affect the
                predicted {optimization.targetName} while holding other
                parameters constant.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {optimization.targetMode === "MAX"
                  ? "Brighter/higher regions indicate better predicted performance."
                  : "Darker/lower regions indicate better predicted performance."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
