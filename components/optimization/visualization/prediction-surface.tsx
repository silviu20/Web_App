// components/optimization/visualization/prediction-surface.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Surface,
  Symbols
} from "recharts"
import { getPredictionsWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { toast } from "@/components/ui/use-toast"
import { SelectOptimization } from "@/db/schema/optimizations-schema"

interface PredictionSurfaceProps {
  optimization: SelectOptimization
}

export function PredictionSurface({ optimization }: PredictionSurfaceProps) {
  // Extract parameters from the optimization config
  const parameters = optimization.config?.parameters || []

  // State for parameter selection and control values
  const [isLoading, setIsLoading] = useState(false)
  const [xParameter, setXParameter] = useState<string>("")
  const [yParameter, setYParameter] = useState<string>("")
  const [controlValues, setControlValues] = useState<Record<string, any>>({})
  const [predictions, setPredictions] = useState<any[]>([])
  const [colorScale, setColorScale] = useState<"linear" | "log">("linear")

  // Sort parameters by name for consistent display
  const sortedParameters = [...parameters].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Initialize selected parameters and control values
  useEffect(() => {
    if (sortedParameters.length >= 2) {
      setXParameter(sortedParameters[0].name)
      setYParameter(sortedParameters[1].name)

      // Initialize control values for all other parameters
      const initialControls: Record<string, any> = {}
      sortedParameters.forEach(param => {
        if (
          param.name !== sortedParameters[0].name &&
          param.name !== sortedParameters[1].name
        ) {
          if (param.type === "NumericalContinuous" && param.bounds) {
            initialControls[param.name] =
              (param.bounds[0] + param.bounds[1]) / 2
          } else if (
            (param.type === "NumericalDiscrete" ||
              param.type === "CategoricalParameter") &&
            param.values
          ) {
            initialControls[param.name] = param.values[0]
          }
        }
      })
      setControlValues(initialControls)
    }
  }, [parameters])

  // Generate prediction points for the selected parameters
  const generatePoints = async () => {
    if (!xParameter || !yParameter) {
      toast({
        title: "Error",
        description: "Please select both X and Y parameters",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Get parameter definitions
      const xParam = parameters.find(p => p.name === xParameter)
      const yParam = parameters.find(p => p.name === yParameter)

      if (!xParam || !yParam) {
        throw new Error("Selected parameters not found")
      }

      // Generate a grid of points
      const points: Record<string, any>[] = []
      const gridSize = 15 // 15x15 grid = 225 points

      // Handle different parameter types
      const getSteps = (param: any) => {
        if (param.type === "NumericalContinuous" && param.bounds) {
          const [min, max] = param.bounds
          const step = (max - min) / (gridSize - 1)
          return Array.from({ length: gridSize }, (_, i) => min + i * step)
        } else if (
          (param.type === "NumericalDiscrete" ||
            param.type === "CategoricalParameter") &&
          param.values
        ) {
          // For discrete parameters, use all available values up to gridSize
          return param.values.slice(0, gridSize)
        } else {
          throw new Error(`Cannot generate steps for parameter ${param.name}`)
        }
      }

      const xSteps = getSteps(xParam)
      const ySteps = getSteps(yParam)

      // Generate all combinations of x and y with the control values
      for (const x of xSteps) {
        for (const y of ySteps) {
          const point = { ...controlValues }
          point[xParameter] = x
          point[yParameter] = y
          points.push(point)
        }
      }

      // Get predictions from the API
      const result = await getPredictionsWorkflowAction(
        optimization.optimizerId,
        points
      )

      if (result.isSuccess && result.data) {
        setPredictions(result.data.predictions)
        toast({
          title: "Predictions Generated",
          description: `Generated ${result.data.predictions.length} prediction points`
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error generating predictions:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate predictions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format data for the chart
  const formatChartData = () => {
    return predictions.map(prediction => ({
      [xParameter]: prediction.parameters[xParameter],
      [yParameter]: prediction.parameters[yParameter],
      prediction: prediction.prediction,
      ci_lower: prediction.uncertainty?.ci_lower,
      ci_upper: prediction.uncertainty?.ci_upper
    }))
  }

  const chartData = formatChartData()

  // Handle parameter selection changes
  const handleParameterChange = (paramName: string, value: string) => {
    if (paramName === "x") {
      if (value === yParameter) {
        // Swap parameters
        setYParameter(xParameter)
      }
      setXParameter(value)
    } else if (paramName === "y") {
      if (value === xParameter) {
        // Swap parameters
        setXParameter(yParameter)
      }
      setYParameter(value)
    }
  }

  // Handle control value changes
  const handleControlChange = (paramName: string, value: any) => {
    setControlValues(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  // Render control input based on parameter type
  const renderControlInput = (param: any) => {
    const name = param.name
    const value = controlValues[name]

    if (name === xParameter || name === yParameter) {
      return null
    }

    switch (param.type) {
      case "NumericalContinuous":
        return (
          <div className="space-y-1" key={name}>
            <Label className="text-xs">{name}</Label>
            <div className="flex items-center gap-2">
              <Slider
                id={name}
                min={param.bounds?.[0] ?? 0}
                max={param.bounds?.[1] ?? 100}
                step={(param.bounds?.[1] - param.bounds?.[0]) / 100}
                value={[value !== undefined ? value : (param.bounds?.[0] ?? 0)]}
                onValueChange={values => handleControlChange(name, values[0])}
                className="flex-1"
              />
              <div className="w-12 text-right text-xs">
                {typeof value === "number" ? value.toFixed(1) : value}
              </div>
            </div>
          </div>
        )

      case "NumericalDiscrete":
      case "CategoricalParameter":
        return (
          <div className="space-y-1" key={name}>
            <Label className="text-xs">{name}</Label>
            <Select
              value={value !== undefined ? String(value) : ""}
              onValueChange={val => {
                // Convert to number if it's a NumericalDiscrete parameter
                const convertedVal =
                  param.type === "NumericalDiscrete" && !isNaN(parseFloat(val))
                    ? parseFloat(val)
                    : val
                handleControlChange(name, convertedVal)
              }}
            >
              <SelectTrigger id={name} className="h-8">
                <SelectValue placeholder={`Select ${name}`} />
              </SelectTrigger>
              <SelectContent>
                {param.values?.map((val: any) => (
                  <SelectItem key={val} value={String(val)}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      default:
        return null
    }
  }

  // Get min/max values for color scale
  const getColorDomain = () => {
    if (chartData.length === 0) return [0, 1]

    // Calculate min/max prediction values
    let min = Infinity
    let max = -Infinity

    for (const point of chartData) {
      min = Math.min(min, point.prediction)
      max = Math.max(max, point.prediction)
    }

    // Add some padding to the range
    const padding = (max - min) * 0.1
    return [min - padding, max + padding]
  }

  // Custom point shape to show prediction value with color
  const renderCustomShape = (props: any) => {
    const { cx, cy, fill } = props
    return <circle cx={cx} cy={cy} r={3} fill={fill} />
  }

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-md border bg-white p-2 shadow-md dark:bg-gray-800">
          <p className="text-xs font-semibold">
            {optimization.targetName}: {data.prediction.toFixed(4)}
          </p>
          <p className="text-xs">
            {xParameter}:{" "}
            {typeof data[xParameter] === "number"
              ? data[xParameter].toFixed(4)
              : data[xParameter]}
          </p>
          <p className="text-xs">
            {yParameter}:{" "}
            {typeof data[yParameter] === "number"
              ? data[yParameter].toFixed(4)
              : data[yParameter]}
          </p>
          {data.ci_lower !== undefined && data.ci_upper !== undefined && (
            <p className="text-xs">
              95% CI: [{data.ci_lower.toFixed(4)}, {data.ci_upper.toFixed(4)}]
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prediction Surface</CardTitle>
          <CardDescription>
            Visualize how parameters affect {optimization.targetName}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Parameter selection and controls */}
          <div className="w-full space-y-4 md:w-64">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>X-Axis Parameter</Label>
                <Select
                  value={xParameter}
                  onValueChange={val => handleParameterChange("x", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedParameters.map(param => (
                      <SelectItem key={param.name} value={param.name}>
                        {param.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Y-Axis Parameter</Label>
                <Select
                  value={yParameter}
                  onValueChange={val => handleParameterChange("y", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedParameters.map(param => (
                      <SelectItem key={param.name} value={param.name}>
                        {param.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Color Scale</Label>
                <Select
                  value={colorScale}
                  onValueChange={val => setColorScale(val as "linear" | "log")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="log">Logarithmic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Fixed Parameters</Label>
              <div className="max-h-[300px] space-y-3 overflow-y-auto rounded-md border p-3">
                {sortedParameters.map(param => renderControlInput(param))}
              </div>
            </div>

            <Button
              onClick={generatePoints}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Generate Predictions
            </Button>
          </div>

          {/* Prediction visualization */}
          <div className="h-[500px] flex-1">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey={xParameter}
                    name={xParameter}
                    label={{ value: xParameter, position: "bottom" }}
                  />
                  <YAxis
                    type="number"
                    dataKey={yParameter}
                    name={yParameter}
                    label={{ value: yParameter, angle: -90, position: "left" }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="prediction"
                    range={[20, 500]}
                    name={optimization.targetName}
                    scale={colorScale}
                    domain={getColorDomain()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Scatter
                    name={`Predicted ${optimization.targetName}`}
                    data={chartData}
                    fill="#8884d8"
                    shape={renderCustomShape}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : isLoading ? (
              <div className="flex h-full items-center justify-center">
                <RefreshCw className="mr-2 size-6 animate-spin" />
                <p>Generating predictions...</p>
              </div>
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
                <p className="mb-2">No prediction data available.</p>
                <p className="text-sm">
                  Select parameters for X and Y axes, then click "Generate
                  Predictions".
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/40 border-t p-4">
        <p className="text-muted-foreground text-sm">
          This visualization shows how the selected parameters affect the
          predicted
          {optimization.targetName}. Darker colors indicate
          {optimization.targetMode === "MAX" ? " higher " : " lower "}
          values.
        </p>
      </CardFooter>
    </Card>
  )
}
