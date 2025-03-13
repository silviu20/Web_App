// components/optimization/visualization/feature-importance-chart.tsx
"use client"

import { useState } from "react"
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from "recharts"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFeatureImportanceWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { InfoIcon, RefreshCw, Lightbulb } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { SelectOptimization } from "@/db/schema/optimizations-schema"

interface FeatureImportanceProps {
  optimization: SelectOptimization
  initialImportance?: Record<string, number>
}

export function FeatureImportanceChart({
  optimization,
  initialImportance
}: FeatureImportanceProps) {
  const [importance, setImportance] = useState<Record<string, number>>(
    initialImportance || {}
  )
  const [isLoading, setIsLoading] = useState(false)
  const [visualizationType, setVisualizationType] = useState<
    "bar" | "waterfall" | "beeswarm" | "scatter"
  >("bar")

  // Fetch feature importance
  const fetchFeatureImportance = async () => {
    setIsLoading(true)
    try {
      const result = await getFeatureImportanceWorkflowAction(
        optimization.optimizerId
      )

      if (result.isSuccess && result.data) {
        setImportance(result.data)
        toast({
          title: "Feature importance updated",
          description:
            "The model's feature importance analysis is now displayed"
        })
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
        description: "Failed to fetch feature importance",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format importance data for the chart
  const formatDataForChart = () => {
    return Object.entries(importance)
      .map(([feature, value]) => ({
        feature,
        importance: typeof value === "number" ? value : 0
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  // Check if we have data
  const hasData = Object.keys(importance).length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Lightbulb className="mr-2 inline-block size-5" />
            Feature Importance Analysis
          </CardTitle>
          <CardDescription>
            Understand which parameters most influence your target
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchFeatureImportance}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Update Analysis
        </Button>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            <Tabs
              value={visualizationType}
              onValueChange={value => setVisualizationType(value as any)}
            >
              <TabsList>
                <TabsTrigger value="bar">Bar</TabsTrigger>
                <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
                <TabsTrigger value="beeswarm">Beeswarm</TabsTrigger>
                <TabsTrigger value="scatter">Scatter</TabsTrigger>
              </TabsList>

              <TabsContent value="bar" className="pt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatDataForChart()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, "dataMax"]} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toFixed(4),
                          "Importance"
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="importance" fill="#8884d8">
                        <LabelList
                          dataKey="importance"
                          position="right"
                          formatter={(value: number) => value.toFixed(3)}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="waterfall" className="pt-4">
                {/* Waterfall chart visualization */}
                <div className="text-muted-foreground py-4 text-center">
                  <InfoIcon className="mx-auto mb-2 size-10 opacity-50" />
                  <p>
                    Waterfall visualization requires additional point-specific
                    analysis.
                  </p>
                  <p className="mt-2">
                    Select a specific data point to analyze its prediction.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="beeswarm" className="pt-4">
                {/* Beeswarm visualization */}
                <div className="text-muted-foreground py-4 text-center">
                  <InfoIcon className="mx-auto mb-2 size-10 opacity-50" />
                  <p>
                    Beeswarm visualization shows the distribution of feature
                    effects across your dataset.
                  </p>
                  <p className="mt-2">
                    This visualization requires additional computation.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="scatter" className="pt-4">
                {/* Scatter visualization */}
                <div className="text-muted-foreground py-4 text-center">
                  <InfoIcon className="mx-auto mb-2 size-10 opacity-50" />
                  <p>
                    Scatter visualization examines relationships between feature
                    values and their impact.
                  </p>
                  <p className="mt-2">
                    Select a feature to analyze its relationship with the
                    target.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h4 className="mb-2 font-medium">Interpretation</h4>
              <p className="text-muted-foreground text-sm">
                Feature importance values show the relative influence of each
                parameter on the target outcome. Higher values indicate stronger
                influence on the optimization target.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Use this information to focus on the most influential parameters
                in future experiments or to validate your understanding of the
                process.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
            <Lightbulb className="mb-4 size-16 opacity-50" />
            <h3 className="mb-2 text-xl">Feature Importance Analysis</h3>
            <p className="max-w-md text-center">
              Analyze which parameters have the most impact on your target
              outcome. This helps you understand the key drivers of performance.
            </p>
            <Button
              onClick={fetchFeatureImportance}
              className="mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Run Feature Importance Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
