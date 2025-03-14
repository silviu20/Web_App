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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Beaker,
  RotateCw
} from "lucide-react"
import {
  getSuggestionWorkflowAction,
  addMeasurementWorkflowAction
} from "@/actions/optimization-workflow-actions"
import { addMultipleMeasurementsWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { toast } from "@/components/ui/use-toast"
import { SelectOptimization } from "@/db/schema/optimizations-schema"

interface RunExperimentProps {
  optimization: SelectOptimization
}

export function RunExperiment({ optimization }: RunExperimentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("suggestions")
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [batchSize, setBatchSize] = useState(1)
  const [manualParameters, setManualParameters] = useState<Record<string, any>>(
    {}
  )
  const [targetValue, setTargetValue] = useState<string>("")
  const [measurements, setMeasurements] = useState<
    Array<{
      parameters: Record<string, any>
      targetValue: string
      isRecommended: boolean
    }>
  >([])

  // Extract parameter metadata from the optimization
  const parameters = optimization.config?.parameters || []

  // Fetch initial suggestions when the component loads
  useEffect(() => {
    fetchSuggestions()

    // Initialize manual parameters with default values
    const initialParams: Record<string, any> = {}
    parameters.forEach(param => {
      if (param.type === "NumericalContinuous" && param.bounds) {
        initialParams[param.name] = (param.bounds[0] + param.bounds[1]) / 2
      } else if (
        (param.type === "NumericalDiscrete" ||
          param.type === "CategoricalParameter") &&
        param.values
      ) {
        initialParams[param.name] = param.values[0]
      }
    })
    setManualParameters(initialParams)
  }, [])

  // Fetch suggestions from the optimizer
  const fetchSuggestions = async () => {
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
          description: `Generated ${result.data.length} experiment suggestion${result.data.length > 1 ? "s" : ""}`
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch suggestions",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Submit a measurement for a suggested experiment
  const submitSuggestionMeasurement = async (
    suggestion: any,
    value: string
  ) => {
    setIsSubmitting(true)
    try {
      const numericValue = parseFloat(value)

      if (isNaN(numericValue)) {
        toast({
          title: "Invalid value",
          description: "Please enter a valid number for the target value",
          variant: "destructive"
        })
        return
      }

      const result = await addMeasurementWorkflowAction(
        optimization.optimizerId,
        suggestion,
        numericValue,
        true // Mark as recommended
      )

      if (result.isSuccess) {
        toast({
          title: "Measurement added",
          description: "The measurement has been recorded successfully"
        })

        // Remove this suggestion from the list
        setSuggestions(prev => prev.filter(s => s !== suggestion))

        // Refresh suggestions if all have been used
        if (suggestions.length <= 1) {
          fetchSuggestions()
        }

        // Return to the optimization details page
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting measurement:", error)
      toast({
        title: "Error",
        description: "Failed to submit measurement",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit a manual measurement
  const submitManualMeasurement = async () => {
    setIsSubmitting(true)
    try {
      const numericValue = parseFloat(targetValue)

      if (isNaN(numericValue)) {
        toast({
          title: "Invalid value",
          description: "Please enter a valid number for the target value",
          variant: "destructive"
        })
        return
      }

      const result = await addMeasurementWorkflowAction(
        optimization.optimizerId,
        manualParameters,
        numericValue,
        false // Mark as manually entered
      )

      if (result.isSuccess) {
        toast({
          title: "Measurement added",
          description: "The manual measurement has been recorded successfully"
        })

        // Clear the target value
        setTargetValue("")

        // Return to the optimization details page
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting measurement:", error)
      toast({
        title: "Error",
        description: "Failed to submit measurement",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a measurement to the batch
  const addToBatch = () => {
    if (!targetValue || isNaN(parseFloat(targetValue))) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid number for the target value",
        variant: "destructive"
      })
      return
    }

    setMeasurements(prev => [
      ...prev,
      {
        parameters: { ...manualParameters },
        targetValue,
        isRecommended: false
      }
    ])

    setTargetValue("")
  }

  // Remove a measurement from the batch
  const removeFromBatch = (index: number) => {
    setMeasurements(prev => prev.filter((_, i) => i !== index))
  }

  // Submit multiple measurements as a batch
  const submitBatchMeasurements = async () => {
    if (measurements.length === 0) {
      toast({
        title: "No measurements",
        description: "Please add at least one measurement to the batch",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formattedMeasurements = measurements.map(m => ({
        parameters: m.parameters,
        target_value: parseFloat(m.targetValue),
        isRecommended: m.isRecommended
      }))

      const result = await addMultipleMeasurementsWorkflowAction(
        optimization.optimizerId,
        formattedMeasurements
      )

      if (result.isSuccess) {
        toast({
          title: "Measurements added",
          description: `${measurements.length} measurements have been recorded successfully`
        })

        // Clear the batch
        setMeasurements([])

        // Return to the optimization details page
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting batch measurements:", error)
      toast({
        title: "Error",
        description: "Failed to submit measurements",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update a manual parameter value
  const updateParameter = (name: string, value: any) => {
    setManualParameters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Render parameter input based on type
  const renderParameterInput = (param: any) => {
    const name = param.name
    const value = manualParameters[name]

    switch (param.type) {
      case "NumericalContinuous":
        return (
          <div className="space-y-2" key={name}>
            <div className="flex items-center justify-between">
              <Label htmlFor={name}>{name}</Label>
              <Input
                id={`${name}-value`}
                value={value !== undefined ? value : ""}
                onChange={e =>
                  updateParameter(name, parseFloat(e.target.value))
                }
                className="w-20 text-right"
              />
            </div>
            <Slider
              id={name}
              min={param.bounds?.[0] ?? 0}
              max={param.bounds?.[1] ?? 100}
              step={(param.bounds?.[1] - param.bounds?.[0]) / 100}
              value={[value !== undefined ? value : (param.bounds?.[0] ?? 0)]}
              onValueChange={values => updateParameter(name, values[0])}
            />
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>{param.bounds?.[0] ?? 0}</span>
              <span>{param.bounds?.[1] ?? 100}</span>
            </div>
          </div>
        )

      case "NumericalDiscrete":
      case "CategoricalParameter":
        return (
          <div className="space-y-2" key={name}>
            <Label htmlFor={name}>{name}</Label>
            <Select
              value={value !== undefined ? String(value) : ""}
              onValueChange={val => {
                // Convert to number if it's a NumericalDiscrete parameter
                const convertedVal =
                  param.type === "NumericalDiscrete" && !isNaN(parseFloat(val))
                    ? parseFloat(val)
                    : val
                updateParameter(name, convertedVal)
              }}
            >
              <SelectTrigger id={name}>
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
        return (
          <div className="space-y-2" key={name}>
            <Label htmlFor={name}>{name}</Label>
            <Input
              id={name}
              value={value !== undefined ? value : ""}
              onChange={e => updateParameter(name, e.target.value)}
              placeholder={`Enter ${name}`}
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Beaker className="mr-2 size-5" />
            Run Experiments for {optimization.name}
          </CardTitle>
          <CardDescription>
            This is where you can run experiments for your optimization, either
            by using AI-suggested parameters or by manually specifying your own.
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardContent>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="batch">Batch Upload</TabsTrigger>
            </TabsList>
          </CardContent>

          <TabsContent value="suggestions">
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    AI-Suggested Experiments
                  </h3>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="batch-size">Batch Size:</Label>
                      <Select
                        value={String(batchSize)}
                        onValueChange={val => setBatchSize(parseInt(val, 10))}
                      >
                        <SelectTrigger id="batch-size" className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 5, 10].map(num => (
                            <SelectItem key={num} value={String(num)}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={fetchSuggestions}
                      disabled={isLoadingSuggestions}
                    >
                      {isLoadingSuggestions ? (
                        <RefreshCw className="mr-2 size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 size-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>

                {suggestions.length > 0 ? (
                  <div className="space-y-6">
                    {suggestions.map((suggestion, idx) => (
                      <Card key={idx} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Suggestion #{idx + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {parameters.map(param => (
                              <div
                                key={param.name}
                                className="rounded-md border p-3"
                              >
                                <div className="text-sm font-medium">
                                  {param.name}
                                </div>
                                <div className="mt-1 text-2xl font-bold">
                                  {typeof suggestion[param.name] === "number"
                                    ? suggestion[param.name].toFixed(
                                        suggestion[param.name] % 1 === 0 ? 0 : 4
                                      )
                                    : suggestion[param.name]}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 rounded-md border border-dashed p-4">
                            <h4 className="mb-2 text-sm font-medium">
                              Add Result for {optimization.targetName}{" "}
                              {optimization.targetMode === "MAX" ? (
                                <ArrowUp className="ml-1 inline-block size-4 text-green-500" />
                              ) : (
                                <ArrowDown className="ml-1 inline-block size-4 text-red-500" />
                              )}
                            </h4>
                            <div className="flex items-end space-x-4">
                              <div className="grow">
                                <Label htmlFor={`target-${idx}`}>
                                  Result Value
                                </Label>
                                <Input
                                  id={`target-${idx}`}
                                  type="number"
                                  step="0.01"
                                  placeholder="Enter measured value"
                                  className="mt-1"
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  const inputEl = document.getElementById(
                                    `target-${idx}`
                                  ) as HTMLInputElement
                                  if (inputEl) {
                                    submitSuggestionMeasurement(
                                      suggestion,
                                      inputEl.value
                                    )
                                  }
                                }}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <RotateCw className="mr-2 size-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 size-4" />
                                )}
                                Submit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : isLoadingSuggestions ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="mr-2 size-6 animate-spin" />
                    <p>Loading suggestions...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12">
                    <AlertCircle className="text-muted-foreground mb-4 size-12" />
                    <p className="text-muted-foreground mb-4">
                      No suggestions available.
                    </p>
                    <Button onClick={fetchSuggestions}>
                      <RefreshCw className="mr-2 size-4" />
                      Generate Suggestions
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="manual">
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Manual Parameter Entry</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Parameters</h4>
                    {parameters.map(param => renderParameterInput(param))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Preview</h4>
                    <div className="rounded-md border p-4">
                      <div className="space-y-2">
                        {Object.entries(manualParameters).map(
                          ([name, value]) => (
                            <div key={name} className="flex justify-between">
                              <span className="font-medium">{name}:</span>
                              <span>
                                {typeof value === "number"
                                  ? value.toFixed(value % 1 === 0 ? 0 : 4)
                                  : String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-md border border-dashed p-4">
                      <h4 className="mb-2 text-sm font-medium">
                        Add Result for {optimization.targetName}{" "}
                        {optimization.targetMode === "MAX" ? (
                          <ArrowUp className="ml-1 inline-block size-4 text-green-500" />
                        ) : (
                          <ArrowDown className="ml-1 inline-block size-4 text-red-500" />
                        )}
                      </h4>
                      <div className="flex items-end space-x-4">
                        <div className="grow">
                          <Label htmlFor="manual-target">Result Value</Label>
                          <Input
                            id="manual-target"
                            type="number"
                            step="0.01"
                            placeholder="Enter measured value"
                            value={targetValue}
                            onChange={e => setTargetValue(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={submitManualMeasurement}
                          disabled={isSubmitting || !targetValue}
                        >
                          {isSubmitting ? (
                            <RotateCw className="mr-2 size-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 size-4" />
                          )}
                          Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="batch">
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Batch Measurement Entry
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Parameters</h4>
                    {parameters.map(param => renderParameterInput(param))}

                    <div className="rounded-md border border-dashed p-4">
                      <h4 className="mb-2 text-sm font-medium">
                        {optimization.targetName} Value{" "}
                        {optimization.targetMode === "MAX" ? (
                          <ArrowUp className="ml-1 inline-block size-4 text-green-500" />
                        ) : (
                          <ArrowDown className="ml-1 inline-block size-4 text-red-500" />
                        )}
                      </h4>
                      <div className="flex items-end space-x-4">
                        <div className="grow">
                          <Label htmlFor="batch-target">Result Value</Label>
                          <Input
                            id="batch-target"
                            type="number"
                            step="0.01"
                            placeholder="Enter measured value"
                            value={targetValue}
                            onChange={e => setTargetValue(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={addToBatch} disabled={!targetValue}>
                          Add to Batch
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Batch Measurements</h4>
                    {measurements.length > 0 ? (
                      <div className="max-h-[400px] overflow-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Parameters</TableHead>
                              <TableHead className="text-right">
                                Value
                              </TableHead>
                              <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {measurements.map((measurement, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>
                                  <div className="max-h-[100px] overflow-auto text-xs">
                                    {Object.entries(measurement.parameters).map(
                                      ([name, value]) => (
                                        <div key={name}>
                                          <span className="font-medium">
                                            {name}:
                                          </span>{" "}
                                          {typeof value === "number"
                                            ? value.toFixed(
                                                value % 1 === 0 ? 0 : 2
                                              )
                                            : String(value)}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {measurement.targetValue}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFromBatch(idx)}
                                  >
                                    <span className="sr-only">Remove</span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="size-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center justify-center rounded-md border border-dashed p-6">
                        <p>No measurements added to batch yet.</p>
                      </div>
                    )}

                    {measurements.length > 0 && (
                      <Button
                        className="w-full"
                        onClick={submitBatchMeasurements}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <RotateCw className="mr-2 size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 size-4" />
                        )}
                        Submit {measurements.length} Measurement
                        {measurements.length !== 1 ? "s" : ""}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="bg-muted/40 border-t p-6">
          <p className="text-muted-foreground text-sm">
            {optimization.targetMode === "MAX" ? "Maximizing" : "Minimizing"}{" "}
            <span className="font-medium">{optimization.targetName}</span>.
            Remember to enter accurate measurements to help the optimizer learn
            and improve its suggestions.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
