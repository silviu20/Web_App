// components/optimization/run-experiment.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { MultiTargetMeasurementForm } from "@/components/optimization/multi-target-measurement-form"
import {
  getSuggestionWorkflowAction,
  addMultiTargetMeasurementWorkflowAction
} from "@/actions/advanced-optimization-workflow-actions"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import { Loader2, RefreshCw, Beaker, Database } from "lucide-react"

interface RunExperimentProps {
  optimization: SelectOptimization
}

export function RunExperiment({ optimization }: RunExperimentProps) {
  const [activeTab, setActiveTab] = useState("api")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null)
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [isSubmittingResult, setIsSubmittingResult] = useState(false)
  const [measurementAdded, setMeasurementAdded] = useState(false)

  // Fetch a suggestion when component mounts
  useEffect(() => {
    fetchSuggestion()
  }, [])

  // Fetch a new suggestion from the API
  const fetchSuggestion = async () => {
    setIsLoadingSuggestion(true)
    setSuggestions([])

    try {
      const result = await getSuggestionWorkflowAction(
        optimization.optimizerId,
        1
      )

      if (result.isSuccess && result.data) {
        setSuggestions(result.data)
        setCurrentSuggestion(result.data[0])
      } else {
        toast({
          title: "Error getting suggestion",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to fetch suggestion. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSuggestion(false)
    }
  }

  // Handle submitting a measurement for an API suggestion
  const handleSubmitMeasurement = async (
    targetValues: Record<string, number>
  ) => {
    if (!currentSuggestion) {
      toast({
        title: "Error",
        description: "No suggestion to submit a measurement for",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingResult(true)

    try {
      const result = await addMultiTargetMeasurementWorkflowAction(
        optimization.optimizerId,
        currentSuggestion.parameters,
        targetValues,
        true // This is a recommended experiment from the API
      )

      if (result.isSuccess) {
        toast({
          title: "Measurement added",
          description: "Your measurement has been added successfully"
        })

        // Fetch a new suggestion
        fetchSuggestion()
        setMeasurementAdded(true)
      } else {
        toast({
          title: "Error adding measurement",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting measurement:", error)
      toast({
        title: "Error",
        description: "Failed to submit measurement. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingResult(false)
    }
  }

  // Notify when a manual measurement is added
  const handleManualMeasurementAdded = () => {
    setMeasurementAdded(true)

    // Reset after a short delay
    setTimeout(() => {
      setMeasurementAdded(false)
    }, 3000)
  }

  // Get targets from the optimization
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api" className="flex items-center">
            <Beaker className="mr-2 size-4" />
            API Suggestions
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center">
            <Database className="mr-2 size-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* API Suggestions Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Beaker className="mr-2 size-5" />
                API-Recommended Experiment
              </CardTitle>
              <CardDescription>
                The system recommends these parameter values to optimize your
                targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSuggestion ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="text-muted-foreground size-8 animate-spin" />
                </div>
              ) : currentSuggestion ? (
                <>
                  {/* Display current suggestion */}
                  <div className="rounded-md border p-4">
                    <h3 className="mb-3 text-lg font-medium">
                      Suggested Parameters
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {Object.entries(currentSuggestion.parameters).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-sm font-medium">{key}</p>
                            <p className="bg-muted rounded-md px-2 py-1">
                              {typeof value === "number"
                                ? value.toFixed(value % 1 === 0 ? 0 : 4)
                                : String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Target input */}
                  <div className="rounded-md border p-4">
                    <h3 className="mb-4 text-lg font-medium">
                      Enter Target Values
                    </h3>
                    <div className="space-y-4">
                      {targets.map(target => (
                        <div key={target.name} className="space-y-2">
                          <label className="text-sm font-medium">
                            {target.name}
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-md border px-3 py-2"
                            placeholder={`Enter ${target.name} result`}
                            id={`target-${target.name}`}
                            step="any"
                          />
                          <p className="text-muted-foreground text-xs">
                            {target.mode === "MAX"
                              ? "Target: Higher is better"
                              : target.mode === "MIN"
                                ? "Target: Lower is better"
                                : "Target: Match specific value"}
                          </p>
                        </div>
                      ))}

                      <Button
                        className="w-full"
                        onClick={() => {
                          // Collect all target values
                          const targetValues: Record<string, number> = {}
                          let missingValue = false

                          targets.forEach(target => {
                            const inputEl = document.getElementById(
                              `target-${target.name}`
                            ) as HTMLInputElement
                            if (inputEl && inputEl.value) {
                              targetValues[target.name] = parseFloat(
                                inputEl.value
                              )
                            } else {
                              missingValue = true
                            }
                          })

                          if (missingValue) {
                            toast({
                              title: "Missing values",
                              description:
                                "Please enter values for all targets",
                              variant: "destructive"
                            })
                            return
                          }

                          handleSubmitMeasurement(targetValues)
                        }}
                        disabled={isSubmittingResult}
                      >
                        {isSubmittingResult ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Results"
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center space-y-2">
                  <p className="text-muted-foreground">
                    No suggestion available
                  </p>
                  <Button onClick={fetchSuggestion} variant="outline">
                    <RefreshCw className="mr-2 size-4" />
                    Get Suggestion
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={fetchSuggestion}
                disabled={isLoadingSuggestion}
              >
                {isLoadingSuggestion ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Get New Suggestion
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual">
          <MultiTargetMeasurementForm
            optimization={optimization}
            onMeasurementAdded={handleManualMeasurementAdded}
          />
        </TabsContent>
      </Tabs>

      {/* Success message when measurement is added */}
      {measurementAdded && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="size-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Measurement Added Successfully
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Your data has been recorded and the model will be updated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
