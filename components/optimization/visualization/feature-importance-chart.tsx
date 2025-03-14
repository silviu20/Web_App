// components/optimization/visualization/feature-importance-chart.tsx
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
import { RefreshCw } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from "recharts"
import { getFeatureImportanceWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { toast } from "@/components/ui/use-toast"
import { SelectOptimization } from "@/db/schema/optimizations-schema"

interface FeatureImportanceChartProps {
  optimization: SelectOptimization
  initialImportance?: Record<string, number>
}

export function FeatureImportanceChart({
  optimization,
  initialImportance = {}
}: FeatureImportanceChartProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [featureImportance, setFeatureImportance] =
    useState<Record<string, number>>(initialImportance)

  // Format data for the chart
  const formatChartData = () => {
    return Object.entries(featureImportance)
      .map(([feature, importance]) => ({
        feature,
        importance: parseFloat((importance * 100).toFixed(2))
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  const chartData = formatChartData()

  // Load feature importance data
  const loadFeatureImportance = async () => {
    setIsLoading(true)
    try {
      const result = await getFeatureImportanceWorkflowAction(
        optimization.optimizerId
      )

      if (result.isSuccess && result.data) {
        setFeatureImportance(result.data)
        toast({
          title: "Feature Importance Updated",
          description: "Successfully loaded feature importance data"
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading feature importance:", error)
      toast({
        title: "Error",
        description: "Failed to load feature importance data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update feature importance if initialImportance changes
  useEffect(() => {
    if (Object.keys(initialImportance).length > 0) {
      setFeatureImportance(initialImportance)
    } else if (Object.keys(featureImportance).length === 0) {
      loadFeatureImportance()
    }
  }, [initialImportance])

  // Custom colors for bars
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
    "#00c49f",
    "#ffbb28",
    "#ff8042",
    "#a4de6c",
    "#d0ed57"
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Feature Importance</CardTitle>
          <CardDescription>
            How much each parameter influences the {optimization.targetName}
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadFeatureImportance}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                />
                <YAxis dataKey="feature" type="category" width={120} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    "Importance"
                  ]}
                />
                <Legend />
                <Bar dataKey="importance" name="Relative Importance (%)">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="mr-2 size-6 animate-spin" />
            <p>Loading feature importance data...</p>
          </div>
        ) : (
          <div className="text-muted-foreground flex items-center justify-center py-12">
            <p>
              No feature importance data available. Try refreshing or adding
              more measurements.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/40 border-t p-4">
        <p className="text-muted-foreground text-sm">
          Feature importance shows how much each parameter influences the
          optimization outcome. Higher percentages indicate stronger influence
          on {optimization.targetName}.
        </p>
      </CardFooter>
    </Card>
  )
}
