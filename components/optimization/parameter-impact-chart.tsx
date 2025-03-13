// components/optimization/parameter-impact-chart.tsx
// This is a new implementation of the ParameterImpactChart component
// that was missing from the original codebase.
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
  ResponsiveContainer
} from "recharts"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

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

  // Skip if we don't have enough data or parameters
  if (measurements.length < 5 || parameterNames.length === 0) {
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

      const avgTargetValue =
        relevantMeasurements.reduce(
          (sum, m) => sum + parseFloat(m.targetValue),
          0
        ) / relevantMeasurements.length

      return {
        parameterValue: value,
        averageTargetValue: avgTargetValue,
        count: relevantMeasurements.length
      }
    })
  }

  const impactData = calculateParameterImpact(selectedParameter)

  // Format parameter value for display
  const formatParameterValue = (value: any) => {
    if (typeof value === "number") {
      return value.toFixed(2)
    }
    if (typeof value === "boolean") {
      return value ? "True" : "False"
    }
    return String(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Parameter Impact Analysis</CardTitle>
        <CardDescription>
          How different parameter values affect the target outcome
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
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
        </div>

        {impactData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={impactData}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
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
                  formatter={(value: number) => [
                    value.toFixed(4),
                    `Average ${targetName}`
                  ]}
                  labelFormatter={formatParameterValue}
                />
                <Legend />
                <Bar
                  name={`Average ${targetName}`}
                  dataKey="averageTargetValue"
                  fill="#8884d8"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <p>Not enough data to analyze parameter impact.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
