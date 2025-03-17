// components/optimization/visualization/feature-importance-chart.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import { getFeatureImportanceWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from "recharts"
import { toast } from "@/components/ui/use-toast"

interface FeatureImportanceChartProps {
  optimization: SelectOptimization
  initialImportance?: Record<string, any>
}

export function FeatureImportanceChart({
  optimization,
  initialImportance
}: FeatureImportanceChartProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [featureImportance, setFeatureImportance] = useState<
    Record<string, any>
  >(initialImportance || {})
  const [activeTarget, setActiveTarget] = useState<string>(
    optimization.primaryTargetName
  )

  // Get all target information from the optimization
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  // Fetch feature importance data
  const fetchFeatureImportance = async () => {
    setIsLoading(true)
    try {
      const result = await getFeatureImportanceWorkflowAction(
        optimization.optimizerId
      )
      if (result.isSuccess && result.data) {
        setFeatureImportance(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching feature importance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch feature importance data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format feature importance data for the chart
  const formatImportanceData = (
    importanceData: Record<string, any>,
    targetName: string
  ) => {
    // Check if we have multi-target importances
    const hasMultiTargetData = importanceData[targetName] !== undefined

    // Get the right set of importances
    const importances = hasMultiTargetData
      ? importanceData[targetName]
      : importanceData

    // If there's no data, return empty array
    if (!importances) return []

    // Format the data for the chart
    return Object.entries(importances)
      .map(([feature, value]) => ({
        feature,
        importance: typeof value === "number" ? value : 0
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  // Get the chart data for the active target
  const chartData = formatImportanceData(featureImportance, activeTarget)

  // Check if we have any data
  const hasData = Object.keys(featureImportance).length > 0

  // Check if we have multi-target data
  const isMultiTargetData =
    hasData && featureImportance[targets[0].name] !== undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Importance Analysis</CardTitle>
        <CardDescription>
          See which parameters have the most impact on your optimization targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            {/* Target Selector (only show for multi-target) */}
            {targets.length > 1 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium">Select Target</h3>
                <div className="flex flex-wrap gap-2">
                  {targets.map(target => (
                    <Button
                      key={target.name}
                      variant={
                        activeTarget === target.name ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveTarget(target.name)}
                    >
                      {target.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Importance Chart */}
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number">
                      <Label
                        value="Relative Importance (%)"
                        position="insideBottom"
                        offset={-5}
                      />
                    </XAxis>
                    <YAxis dataKey="feature" type="category" width={100} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(2)}%`,
                        "Importance"
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="importance"
                      name={`Impact on ${activeTarget}`}
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">
                  No feature importance data available for {activeTarget}
                </p>
              </div>
            )}

            {/* Explanation */}
            <div className="bg-muted rounded-md p-4 text-sm">
              <h3 className="mb-2 font-medium">
                Understanding Feature Importance
              </h3>
              <p className="text-muted-foreground">
                Feature importance shows how much each parameter influences the
                optimization outcome. Higher values indicate parameters that
                have more impact on the target. Focus on adjusting parameters
                with high importance to improve results more effectively.
              </p>

              {isMultiTargetData && targets.length > 1 && (
                <p className="text-muted-foreground mt-2">
                  Different targets may be influenced by different parameters.
                  Use the target selector above to see which parameters are most
                  important for each target.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>No Feature Importance Data</AlertTitle>
              <AlertDescription>
                Feature importance analysis requires sufficient data. Click the
                button below to generate feature importance analysis.
              </AlertDescription>
            </Alert>

            <div className="mt-4 flex justify-center">
              <Button onClick={fetchFeatureImportance} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Generate Feature Importance"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={fetchFeatureImportance}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh Analysis"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
