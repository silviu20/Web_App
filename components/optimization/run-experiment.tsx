// components/optimization/run-experiment.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getSuggestionWorkflowAction,
  addMeasurementWorkflowAction
} from "@/actions/optimization-workflow-actions"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import {
  ArrowDown,
  ArrowUp,
  Beaker,
  Check,
  Lightbulb,
  Loader2,
  RefreshCw,
  RotateCw
} from "lucide-react"

interface RunExperimentProps {
  optimization: SelectOptimization
}

export function RunExperiment({ optimization }: RunExperimentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("suggested")
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [manualParameters, setManualParameters] = useState<Record<string, any>>(
    {}
  )
  const [targetValue, setTargetValue] = useState<string>("")

  // Initialize manual parameters from the optimization config
  useEffect(() => {
    const initialParams = optimization.config.parameters.reduce(
      (acc, param) => {
        if (param.type === "NumericalDiscrete") {
          acc[param.name] =
            param.values && param.values.length > 0 ? param.values[0] : 0
        } else if (param.type === "NumericalContinuous") {
          acc[param.name] = param.bounds ? param.bounds[0] : 0
        } else if (param.type === "CategoricalParameter") {
          acc[param.name] =
            param.values && param.values.length > 0 ? param.values[0] : ""
        }
        return acc
      },
      {} as Record<string, any>
    )
    setManualParameters(initialParams)
  }, [optimization.config.parameters])

  const getSuggestions = async (batchSize: number = 1) => {
    setIsLoadingSuggestions(true)
    try {
      const result = await getSuggestionWorkflowAction(
        optimization.optimizerId,
        batchSize
      )

      if (result.isSuccess && result.data) {
        setSuggestions(result.data)
        toast({
          title: "Suggestions loaded",
          description: `Successfully loaded ${result.data.length} suggestions`
        })
      } else {
        toast({
          title: "Error loading suggestions",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error getting suggestions:", error)
      toast({
        title: "Error",
        description: "Failed to get suggestions",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const addMeasurement = async (
    parameters: Record<string, any>,
    value: number,
    isRecommended: boolean = true
  ) => {
    setIsAddingMeasurement(true)
    try {
      const result = await addMeasurementWorkflowAction(
        optimization.optimizerId,
        parameters,
        value,
        isRecommended
      )

      if (result.isSuccess) {
        toast({
          title: "Measurement added",
          description: "Successfully added measurement to the optimization"
        })

        // Clear target value after successful submission
        setTargetValue("")

        // If this was a suggested measurement, clear suggestions to force fetching new ones
        if (isRecommended) {
          setSuggestions([])
        }

        // Refresh the page to show the updated measurements
        router.refresh()
      } else {
        toast({
          title: "Error adding measurement",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding measurement:", error)
      toast({
        title: "Error",
        description: "Failed to add measurement",
        variant: "destructive"
      })
    } finally {
      setIsAddingMeasurement(false)
    }
  }

  const handleManualParameterChange = (name: string, value: any) => {
    setManualParameters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleManualSubmit = () => {
    // Validate target value
    const parsedValue = parseFloat(targetValue)
    if (isNaN(parsedValue)) {
      toast({
        title: "Invalid target value",
        description: "Please enter a valid number for the target value",
        variant: "destructive"
      })
      return
    }

    // Validate parameters
    for (const param of optimization.config.parameters) {
      const value = manualParameters[param.name]

      if (value === undefined || value === "") {
        toast({
          title: "Missing parameter",
          description: `Please provide a value for ${param.name}`,
          variant: "destructive"
        })
        return
      }

      if (
        param.type === "NumericalDiscrete" ||
        param.type === "NumericalContinuous"
      ) {
        const numValue = typeof value === "string" ? parseFloat(value) : value
        if (isNaN(numValue)) {
          toast({
            title: "Invalid parameter value",
            description: `Please enter a valid number for ${param.name}`,
            variant: "destructive"
          })
          return
        }

        // Convert to number for submission
        manualParameters[param.name] = numValue
      }
    }

    // Submit the measurement
    addMeasurement(manualParameters, parsedValue, false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Run Experiments</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="suggested">
            <Lightbulb className="mr-2 size-4" />
            Suggested Experiments
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Beaker className="mr-2 size-4" />
            Manual Experiments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Suggested Experiments</CardTitle>
              <CardDescription>
                Get experiment suggestions from the optimization API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Request Parameters</h3>
                  <p className="text-muted-foreground text-xs">
                    Get suggestions for your next experiments
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => getSuggestions(1)}
                    disabled={isLoadingSuggestions}
                  >
                    {isLoadingSuggestions ? (
                      <RotateCw className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Get 1 Suggestion
                  </Button>
                  <Button
                    onClick={() => getSuggestions(3)}
                    disabled={isLoadingSuggestions}
                  >
                    {isLoadingSuggestions ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <>Get 3 Suggestions</>
                    )}
                  </Button>
                </div>
              </div>

              {suggestions.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="border-l-4 border-l-blue-500 dark:border-l-blue-400"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          Suggested Experiment #{index + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                          {Object.entries(suggestion).map(([key, value]) => (
                            <div key={key} className="space-y-1.5">
                              <Label htmlFor={`param-${index}-${key}`}>
                                {key}
                              </Label>
                              <Input
                                id={`param-${index}-${key}`}
                                value={
                                  typeof value === "number"
                                    ? value.toFixed(value % 1 === 0 ? 0 : 4)
                                    : String(value)
                                }
                                readOnly
                                className="bg-muted"
                              />
                            </div>
                          ))}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor={`result-${index}`}
                              className="flex items-center"
                            >
                              {optimization.targetName}
                              {optimization.targetMode === "MAX" ? (
                                <ArrowUp className="ml-1 size-4 text-green-500" />
                              ) : (
                                <ArrowDown className="ml-1 size-4 text-green-500" />
                              )}
                            </Label>
                            <Input
                              id={`result-${index}`}
                              placeholder="Enter result"
                              type="number"
                              step="0.0001"
                              value={index === 0 ? targetValue : ""}
                              onChange={e =>
                                index === 0 && setTargetValue(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-end space-x-2">
                        <Button
                          onClick={() => {
                            const value = parseFloat(targetValue)
                            if (!isNaN(value)) {
                              addMeasurement(suggestion, value, true)
                            } else {
                              toast({
                                title: "Invalid value",
                                description: "Please enter a valid number",
                                variant: "destructive"
                              })
                            }
                          }}
                          disabled={isAddingMeasurement || !targetValue}
                        >
                          {isAddingMeasurement ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 size-4" />
                          )}
                          Submit Measurement
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="mt-8 text-center">
                  {isLoadingSuggestions ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="text-muted-foreground mb-4 size-12 animate-spin" />
                      <p className="text-muted-foreground">
                        Generating suggestions...
                      </p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <p className="mb-4">No suggestions loaded yet.</p>
                      <p>
                        Click "Get Suggestions" to receive recommendations for
                        your next experiments.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Lightbulb className="size-5" />
            <AlertTitle>Using AI suggestions</AlertTitle>
            <AlertDescription>
              The optimizer uses Bayesian optimization to suggest the most
              promising experiments based on your results so far. Each new
              measurement helps the AI learn and improve its suggestions.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Experiment Entry</CardTitle>
              <CardDescription>
                Submit your own experiment parameters and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Parameters</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {optimization.config.parameters.map(param => (
                      <div key={param.name} className="space-y-1.5">
                        <Label htmlFor={`manual-${param.name}`}>
                          {param.name}
                        </Label>
                        {param.type === "CategoricalParameter" &&
                        Array.isArray(param.values) ? (
                          <select
                            id={`manual-${param.name}`}
                            value={manualParameters[param.name] || ""}
                            onChange={e =>
                              handleManualParameterChange(
                                param.name,
                                e.target.value
                              )
                            }
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {param.values.map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            id={`manual-${param.name}`}
                            type={
                              param.type.startsWith("Numerical")
                                ? "number"
                                : "text"
                            }
                            step={
                              param.type.startsWith("Numerical")
                                ? "0.0001"
                                : undefined
                            }
                            value={manualParameters[param.name] || ""}
                            onChange={e => {
                              const value = param.type.startsWith("Numerical")
                                ? parseFloat(e.target.value)
                                : e.target.value
                              handleManualParameterChange(
                                param.name,
                                e.target.value
                              )
                            }}
                            placeholder={`Enter ${param.name} value`}
                          />
                        )}

                        {param.type === "NumericalDiscrete" &&
                          Array.isArray(param.values) && (
                            <p className="text-muted-foreground text-xs">
                              Allowed values: {param.values.join(", ")}
                            </p>
                          )}
                        {param.type === "NumericalContinuous" &&
                          param.bounds && (
                            <p className="text-muted-foreground text-xs">
                              Range: {param.bounds[0]} to {param.bounds[1]}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">
                    Result for {optimization.targetName}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="manual-target"
                        className="flex items-center"
                      >
                        {optimization.targetName} Value
                        {optimization.targetMode === "MAX" ? (
                          <ArrowUp className="ml-1 size-4 text-green-500" />
                        ) : (
                          <ArrowDown className="ml-1 size-4 text-green-500" />
                        )}
                      </Label>
                      <Input
                        id="manual-target"
                        type="number"
                        step="0.0001"
                        value={targetValue}
                        onChange={e => setTargetValue(e.target.value)}
                        placeholder={`Enter ${optimization.targetName} value`}
                      />
                      <p className="text-muted-foreground text-xs">
                        The measured value to{" "}
                        {optimization.targetMode === "MAX"
                          ? "maximize"
                          : "minimize"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                onClick={handleManualSubmit}
                disabled={isAddingMeasurement || !targetValue}
              >
                {isAddingMeasurement ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="mr-2 size-4" />
                )}
                Submit Manual Measurement
              </Button>
            </CardFooter>
          </Card>

          <Alert>
            <Beaker className="size-5" />
            <AlertTitle>Manual measurements</AlertTitle>
            <AlertDescription>
              Use this form to enter results from experiments you've conducted
              outside the optimization system. These measurements will be
              incorporated into the model to improve future suggestions.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
