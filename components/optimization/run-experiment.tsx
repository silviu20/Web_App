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
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
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
  RotateCw,
  BarChart,
  ArrowRight,
  Bot,
  Target,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react"
import Link from "next/link"

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
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [batchSize, setBatchSize] = useState(1)
  const [resultsShown, setResultsShown] = useState(false)

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

  const getSuggestions = async (size: number = batchSize) => {
    setIsLoadingSuggestions(true)
    setSelectedSuggestionIndex(0)

    try {
      const result = await getSuggestionWorkflowAction(
        optimization.optimizerId,
        size
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

        // Show results
        setResultsShown(true)

        // Refresh the page to show the updated measurements
        setTimeout(() => {
          router.refresh()
        }, 1500)
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

  // Navigate between suggestions
  const nextSuggestion = () => {
    if (selectedSuggestionIndex < suggestions.length - 1) {
      setSelectedSuggestionIndex(prev => prev + 1)
      setTargetValue("")
    }
  }

  const prevSuggestion = () => {
    if (selectedSuggestionIndex > 0) {
      setSelectedSuggestionIndex(prev => prev - 1)
      setTargetValue("")
    }
  }

  if (resultsShown) {
    return (
      <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Check className="mr-2 size-5 text-green-500" />
            Measurement Recorded Successfully
          </CardTitle>
          <CardDescription>
            Your experimental result has been added to the optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center py-6">
            <div className="rounded-full bg-green-100 p-8 dark:bg-green-900/30">
              <Check className="size-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <p>
              The AI optimizer will use this data to improve its next
              suggestions.
            </p>
            <p>What would you like to do next?</p>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button
              className="flex-1"
              onClick={() => {
                setResultsShown(false)
                setTargetValue("")
                setSuggestions([])
              }}
            >
              <Beaker className="mr-2 size-4" />
              Run Another Experiment
            </Button>

            <Link
              href={`/dashboard/optimizations/${optimization.id}`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full">
                <BarChart className="mr-2 size-4" />
                View Results Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Run Experiments</h2>

      <div className="w-full">
        <div className="mb-4 flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab("suggested")}
            className={`flex items-center px-4 py-2 ${activeTab === "suggested" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`}
          >
            <Bot className="mr-2 size-4" />
            AI-Suggested Experiments
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center px-4 py-2 ${activeTab === "manual" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`}
          >
            <Beaker className="mr-2 size-4" />
            Manual Experiments
          </button>
        </div>

        {activeTab === "suggested" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 size-5 text-amber-500" />
                  AI-Suggested Experiments
                </CardTitle>
                <CardDescription>
                  Get experiment suggestions from the optimization API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
                  <div className="space-y-2">
                    <Label>Number of suggestions to request</Label>
                    <div className="flex items-center space-x-4">
                      <Select
                        value={batchSize.toString()}
                        onValueChange={value => setBatchSize(parseInt(value))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select batch size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 suggestion</SelectItem>
                          <SelectItem value="3">3 suggestions</SelectItem>
                          <SelectItem value="5">5 suggestions</SelectItem>
                          <SelectItem value="10">10 suggestions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={() => getSuggestions(batchSize)}
                    disabled={isLoadingSuggestions}
                    className="w-full sm:w-auto"
                  >
                    {isLoadingSuggestions ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Get Suggestions
                  </Button>
                </div>

                {suggestions.length > 0 ? (
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevSuggestion}
                        disabled={selectedSuggestionIndex === 0}
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </Button>
                      <div className="text-center">
                        <span className="font-medium">
                          Suggestion {selectedSuggestionIndex + 1} of{" "}
                          {suggestions.length}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextSuggestion}
                        disabled={
                          selectedSuggestionIndex === suggestions.length - 1
                        }
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>

                    <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          Suggested Experiment #{selectedSuggestionIndex + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                          {Object.entries(
                            suggestions[selectedSuggestionIndex]
                          ).map(([key, value]) => (
                            <div key={key} className="space-y-1.5">
                              <Label
                                htmlFor={`param-${selectedSuggestionIndex}-${key}`}
                              >
                                {key}
                              </Label>
                              <Input
                                id={`param-${selectedSuggestionIndex}-${key}`}
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
                              htmlFor={`result-${selectedSuggestionIndex}`}
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
                              id={`result-${selectedSuggestionIndex}`}
                              placeholder="Enter result"
                              type="number"
                              step="0.0001"
                              value={targetValue}
                              onChange={e => setTargetValue(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-end space-x-2">
                        <Button
                          onClick={() => {
                            const value = parseFloat(targetValue)
                            if (!isNaN(value)) {
                              addMeasurement(
                                suggestions[selectedSuggestionIndex],
                                value,
                                true
                              )
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

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                      <div className="flex items-start">
                        <Info className="mr-3 mt-0.5 size-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">
                            Why this suggestion?
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-300">
                            The AI optimizer suggests parameter combinations
                            that are most likely to improve the{" "}
                            {optimization.targetName} based on your previous
                            measurements. It balances exploration (trying new
                            areas) and exploitation (refining promising areas).
                          </p>
                        </div>
                      </div>
                    </div>
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
                      <div className="text-muted-foreground py-8">
                        <Bot className="mx-auto mb-4 size-16 opacity-40" />
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
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Beaker className="mr-2 size-5 text-amber-500" />
                  Manual Experiment Entry
                </CardTitle>
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
                            <Select
                              value={manualParameters[param.name] || ""}
                              onValueChange={value =>
                                handleManualParameterChange(param.name, value)
                              }
                            >
                              <SelectTrigger id={`manual-${param.name}`}>
                                <SelectValue
                                  placeholder={`Select ${param.name}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {param.values.map(value => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : param.type === "NumericalDiscrete" &&
                            Array.isArray(param.values) ? (
                            <Select
                              value={String(manualParameters[param.name] || "")}
                              onValueChange={value =>
                                handleManualParameterChange(
                                  param.name,
                                  parseFloat(value)
                                )
                              }
                            >
                              <SelectTrigger id={`manual-${param.name}`}>
                                <SelectValue
                                  placeholder={`Select ${param.name}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {param.values.map(value => (
                                  <SelectItem key={value} value={String(value)}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : param.type === "NumericalContinuous" &&
                            param.bounds ? (
                            <div className="space-y-2">
                              <div className="text-muted-foreground flex justify-between text-xs">
                                <span>{param.bounds[0]}</span>
                                <span>{param.bounds[1]}</span>
                              </div>
                              <Slider
                                id={`manual-${param.name}`}
                                min={param.bounds[0]}
                                max={param.bounds[1]}
                                step={(param.bounds[1] - param.bounds[0]) / 100}
                                value={[
                                  manualParameters[param.name] ||
                                    param.bounds[0]
                                ]}
                                onValueChange={([value]) =>
                                  handleManualParameterChange(param.name, value)
                                }
                              />
                              <Input
                                type="number"
                                value={manualParameters[param.name] || ""}
                                onChange={e =>
                                  handleManualParameterChange(
                                    param.name,
                                    parseFloat(e.target.value)
                                  )
                                }
                                step={(param.bounds[1] - param.bounds[0]) / 100}
                              />
                            </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
