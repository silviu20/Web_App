// components/optimization/parameter-impact-chart.tsx
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { SelectMeasurement } from "@/db/schema/optimizations-schema"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface ParameterImpactChartProps {
  measurements: SelectMeasurement[]
  parameterNames: string[]
  targetName: string
  targetMode: "MAX" | "MIN"
}

export function ParameterImpactChart({
  measurements,
  parameterNames,
  targetName,
  targetMode
}: ParameterImpactChartProps) {
  const [selectedParameter, setSelectedParameter] = useState<string>(
    parameterNames.length > 0 ? parameterNames[0] : ""
  )
  const [visualization, setVisualization] = useState<"bar" | "scatter">("bar")

  // Skip if we don't have enough data or parameters
  if (measurements.length < 3 || parameterNames.length === 0) {
    return null
  }

  // Calculate impact scores for the selected parameter
  const calculateParameterImpact = (paramName: string) => {
    // Get unique values for the parameter
    const uniqueValues = Array.from(
      new Set(
        measurements.map(m =>
          typeof m.parameters[paramName] === "number"
            ? Math.round(m.parameters[paramName] * 100) / 100
            : m.parameters[paramName]
        )
      )
    ).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a - b
      }
      return String(a).localeCompare(String(b))
    })

    // Skip if we don't have enough unique values
    if (uniqueValues.length < 2) {
      return []
    }

    // Calculate average target value for each parameter value
    return uniqueValues.map(value => {
      const relevantMeasurements = measurements.filter(m => {
        const paramValue = m.parameters[paramName]
        if (typeof paramValue === "number" && typeof value === "number") {
          return Math.abs(paramValue - value) < 0.001
        }
        return paramValue === value
      })

      const targetValues = relevantMeasurements.map(m =>
        parseFloat(m.targetValue)
      )
      const avgTargetValue =
        targetValues.reduce((sum, val) => sum + val, 0) / targetValues.length

      // Calculate standard deviation
      const variance =
        targetValues.reduce(
          (sum, val) => sum + Math.pow(val - avgTargetValue, 2),
          0
        ) / targetValues.length
      const stdDev = Math.sqrt(variance)

      return {
        parameterValue: value,
        averageTargetValue: avgTargetValue,
        stdDev: stdDev,
        count: relevantMeasurements.length,
        min: Math.min(...targetValues),
        max: Math.max(...targetValues)
      }
    })
  }

  // For scatter plot - prepare raw data points
  const prepareScatterData = (paramName: string) => {
    return measurements.map(m => ({
      parameterValue:
        typeof m.parameters[paramName] === "number"
          ? Math.round(m.parameters[paramName] * 100) / 100
          : m.parameters[paramName],
      targetValue: parseFloat(m.targetValue),
      id: m.id,
      isRecommended: m.isRecommended
    }))
  }

  const impactData = calculateParameterImpact(selectedParameter)
  const scatterData = prepareScatterData(selectedParameter)

  // Format parameter value for display
  const formatParameterValue = (value: any) => {
    if (value === undefined || value === null) return "N/A"
    if (typeof value === "number") {
      return value.toFixed(2)
    }
    if (typeof value === "boolean") {
      return value ? "True" : "False"
    }
    return String(value)
  }

  // Determine if the parameter is categorical
  const isCategorical =
    impactData.length > 0 && typeof impactData[0].parameterValue !== "number"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Parameter Impact Analysis</CardTitle>
        <CardDescription>
          How different parameter values affect the target outcome
        </CardDescription>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-4 sm:space-y-0">
          <Select
            value={selectedParameter}
            onValueChange={value => setSelectedParameter(value)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select parameter" />
            </SelectTrigger>
            <SelectContent>
              {parameterNames.map(param => (
                <SelectItem key={param} value={param}>
                  {param}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isCategorical && (
            <div className="w-[200px]">
              <div className="grid w-full grid-cols-2 rounded-md border p-1">
                <button
                  onClick={() => setVisualization("bar")}
                  className={`rounded px-2 py-1 text-xs ${visualization === "bar" ? "bg-muted font-medium" : "text-muted-foreground"}`}
                >
                  Average
                </button>
                <button
                  onClick={() => setVisualization("scatter")}
                  className={`rounded px-2 py-1 text-xs ${visualization === "scatter" ? "bg-muted font-medium" : "text-muted-foreground"}`}
                >
                  Scatter
                </button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {impactData.length > 0 ? (
          <>
            {visualization === "bar" && (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={impactData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="parameterValue"
                      tickFormatter={formatParameterValue}
                      label={{
                        value: selectedParameter,
                        position: "insideBottom",
                        offset: -10
                      }}
                    />
                    <YAxis
                      label={{
                        value: `Average ${targetName}`,
                        angle: -90,
                        position: "insideLeft"
                      }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === `Average ${targetName}`) {
                          return [value.toFixed(4), name]
                        }
                        return [value.toFixed(2), name]
                      }}
                      labelFormatter={formatParameterValue}
                    />
                    <Legend />
                    <Bar
                      name={`Average ${targetName}`}
                      dataKey="averageTargetValue"
                      fill="#8884d8"
                    />
                    <Bar name="Count" dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {visualization === "scatter" && !isCategorical && (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="parameterValue"
                      name={selectedParameter}
                      label={{
                        value: selectedParameter,
                        position: "insideBottom",
                        offset: -10
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="targetValue"
                      name={targetName}
                      label={{
                        value: targetName,
                        angle: -90,
                        position: "insideLeft"
                      }}
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value: number) => [value.toFixed(4), ""]}
                      labelFormatter={value =>
                        `${selectedParameter}: ${formatParameterValue(value)}`
                      }
                    />
                    <Legend />
                    <Scatter
                      name="API Suggested"
                      data={scatterData.filter(d => d.isRecommended)}
                      fill="#8884d8"
                    />
                    <Scatter
                      name="Manual"
                      data={scatterData.filter(d => !d.isRecommended)}
                      fill="#82ca9d"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            <Alert className="mt-4">
              <InfoIcon className="size-4" />
              <AlertTitle>Parameter Analysis</AlertTitle>
              <AlertDescription>
                {visualization === "bar" ? (
                  <>
                    This chart shows how the average {targetName} varies with
                    different values of {selectedParameter}.
                  </>
                ) : (
                  <>
                    This scatter plot shows each individual experiment result,
                    with {selectedParameter} on the x-axis and {targetName} on
                    the y-axis.
                  </>
                )}
                {targetMode === "MAX"
                  ? ` Higher values are better.`
                  : ` Lower values are better.`}
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <p>
              Not enough data to analyze parameter impact for{" "}
              {selectedParameter}.
            </p>
            <p className="mt-2 text-sm">
              Try selecting a different parameter or adding more measurements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
