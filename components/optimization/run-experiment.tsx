"use client"

import React, { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  Beaker,
  Check,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Lightbulb,
  Upload,
  Download,
  Clipboard,
  List,
  Grid,
  BarChart,
  MoreHorizontal,
  Zap,
  Info,
  PlusCircle,
  ArrowLeft,
  Copy,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react"

// Form schema for submitting a measurement
const measurementSchema = z.object({
  targetValue: z.coerce.number({
    required_error: "Target value is required",
    invalid_type_error: "Target value must be a number"
  })
})

// Define types for optimization and measurement data
interface Parameter {
  name: string
  type: string
  values?: any[]
  bounds?: [number, number]
  tolerance?: number
}

interface Optimization {
  id: string
  name: string
  description?: string
  optimizerId: string
  targetName: string
  targetMode: "MAX" | "MIN" | "MATCH"
  status: string
  createdAt: string
  config: {
    parameters: Parameter[]
    target_config: any
    recommender_config?: any
    constraints?: any[]
  }
}

interface Measurement {
  id: string
  optimizationId: string
  parameters: Record<string, any>
  targetValue: string
  isRecommended: boolean
  createdAt: string
  batchNr?: number
  fitNr?: number
}

interface Suggestion {
  [key: string]: any
}

export default function RunExperiment({
  optimization
}: {
  optimization: Optimization
}) {
  const router = useRouter()
  const { toast } = useToast()

  // State for suggestions and measurements
  const [loading, setLoading] = useState(false)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(
    null
  )
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [measurementHistory, setMeasurementHistory] = useState<Measurement[]>(
    []
  )
  const [bestPoint, setBestPoint] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [batchSize, setBatchSize] = useState(1)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [manualMode, setManualMode] = useState(false)

  // Manual parameter inputs
  const [manualInputs, setManualInputs] = useState<Record<string, any>>({})

  // Form for submitting measurements
  const form = useForm<z.infer<typeof measurementSchema>>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      targetValue: undefined
    }
  })

  // Initialize component data
  useEffect(() => {
    if (optimization) {
      fetchMeasurementHistory()
      fetchBestPoint()
    }
  }, [optimization])

  // Fetch measurement history
  const fetchMeasurementHistory = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/optimizations/${optimization.id}/measurements`);
      // const data = await response.json();

      // Mock data for demonstration
      const mockHistory: Measurement[] = Array.from({ length: 10 }, (_, i) => ({
        id: `meas-${i}`,
        optimizationId: optimization.id,
        parameters: optimization.config.parameters.reduce((acc, param) => {
          if (param.type.includes("Numerical")) {
            const bounds = param.bounds || [0, 100]
            acc[param.name] =
              Math.random() * (bounds[1] - bounds[0]) + bounds[0]
          } else if (param.values && param.values.length > 0) {
            acc[param.name] =
              param.values[Math.floor(Math.random() * param.values.length)]
          }
          return acc
        }, {}),
        targetValue: (Math.random() * 100).toFixed(2),
        isRecommended: Math.random() > 0.3,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        batchNr: Math.floor(i / 2) + 1,
        fitNr: i + 1
      }))

      setMeasurementHistory(mockHistory)
    } catch (error) {
      console.error("Error fetching measurement history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch measurement history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch the current best point
  const fetchBestPoint = async () => {
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/optimizations/${optimization.optimizerId}/best`);
      // const data = await response.json();

      // Mock data for demonstration
      const mockBestPoint = {
        best_parameters: optimization.config.parameters.reduce((acc, param) => {
          if (param.type.includes("Numerical")) {
            const bounds = param.bounds || [0, 100]
            acc[param.name] = (
              Math.random() * (bounds[1] - bounds[0]) +
              bounds[0]
            ).toFixed(2)
          } else if (param.values && param.values.length > 0) {
            acc[param.name] =
              param.values[Math.floor(Math.random() * param.values.length)]
          }
          return acc
        }, {}),
        best_value: optimization.targetMode === "MAX" ? 92.7 : 14.3
      }

      setBestPoint(mockBestPoint)
    } catch (error) {
      console.error("Error fetching best point:", error)
    }
  }

  // Get suggestion from API
  const getSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/optimizations/${optimization.optimizerId}/suggest?batch_size=${batchSize}`);
      // const data = await response.json();

      // Mock suggestion data
      const generatedSuggestions = Array.from({ length: batchSize }, (_, i) =>
        optimization.config.parameters.reduce((acc, param) => {
          if (param.type.includes("Numerical")) {
            const bounds = param.bounds || [0, 100]
            acc[param.name] = parseFloat(
              (Math.random() * (bounds[1] - bounds[0]) + bounds[0]).toFixed(2)
            )
          } else if (param.values && param.values.length > 0) {
            acc[param.name] =
              param.values[Math.floor(Math.random() * param.values.length)]
          }
          return acc
        }, {})
      )

      setSuggestions(generatedSuggestions)
      if (generatedSuggestions.length > 0) {
        setActiveSuggestion(generatedSuggestions[0])
      }

      toast({
        title: "Suggestions generated",
        description: `Generated ${generatedSuggestions.length} new suggestions`
      })
    } catch (error) {
      console.error("Error getting suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to get suggestions",
        variant: "destructive"
      })
    } finally {
      setLoadingSuggestion(false)
    }
  }

  // Submit a measurement
  const onSubmit = async (values: z.infer<typeof measurementSchema>) => {
    setLoading(true)
    try {
      const parameters = manualMode ? manualInputs : activeSuggestion

      if (!parameters) {
        throw new Error("No parameters selected")
      }

      const measurement = {
        parameters,
        target_value: values.targetValue
      }

      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/optimizations/${optimization.optimizerId}/measurement`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(measurement),
      // });
      // const data = await response.json();

      // Mock successful response
      const newMeasurement: Measurement = {
        id: `meas-${Date.now()}`,
        optimizationId: optimization.id,
        parameters,
        targetValue: values.targetValue.toString(),
        isRecommended: !manualMode,
        createdAt: new Date().toISOString(),
        batchNr:
          measurementHistory.length > 0
            ? Math.max(...measurementHistory.map(m => m.batchNr || 0)) + 1
            : 1,
        fitNr: measurementHistory.length + 1
      }

      // Add to local state
      setMeasurementHistory(prev => [newMeasurement, ...prev])
      setMeasurements(prev => [newMeasurement, ...prev])

      // Reset form
      form.reset()

      // If this was from a suggestion, remove it from the list
      if (!manualMode && activeSuggestion) {
        setSuggestions(prev => prev.filter(s => s !== activeSuggestion))
        if (suggestions.length > 1) {
          setActiveSuggestion(suggestions[1])
        } else {
          setActiveSuggestion(null)
        }
      }

      toast({
        title: "Measurement added",
        description: `Added measurement with ${optimization.targetName} = ${values.targetValue}`
      })

      // Update best point if this is better
      updateBestPoint(parameters, values.targetValue)
    } catch (error) {
      console.error("Error adding measurement:", error)
      toast({
        title: "Error",
        description: "Failed to add measurement",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update best point if new measurement is better
  const updateBestPoint = (parameters: Record<string, any>, value: number) => {
    if (!bestPoint) {
      setBestPoint({ best_parameters: parameters, best_value: value })
      return
    }

    if (
      (optimization.targetMode === "MAX" && value > bestPoint.best_value) ||
      (optimization.targetMode === "MIN" && value < bestPoint.best_value)
    ) {
      setBestPoint({ best_parameters: parameters, best_value: value })
    }
  }

  // Handle change in manual inputs
  const handleManualInputChange = (paramName: string, value: any) => {
    setManualInputs(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  // Format parameter value for display
  const formatParamValue = (value: any, param: Parameter) => {
    if (typeof value === "number") {
      return value.toFixed(2)
    }
    return value
  }

  // Render a parameter input for manual mode
  const renderParameterInput = (param: Parameter) => {
    // Default value based on parameter type
    const getDefaultValue = () => {
      if (param.type.includes("Numerical")) {
        if (param.bounds) {
          return (param.bounds[0] + param.bounds[1]) / 2
        }
        return 0
      } else if (
        param.type.includes("Categorical") &&
        param.values &&
        param.values.length > 0
      ) {
        return param.values[0]
      }
      return ""
    }

    // Initialize value if not set
    if (manualInputs[param.name] === undefined) {
      handleManualInputChange(param.name, getDefaultValue())
    }

    if (param.type.includes("Numerical") && param.values) {
      // Discrete numerical - use select
      return (
        <Select
          value={manualInputs[param.name]?.toString() || ""}
          onValueChange={value =>
            handleManualInputChange(param.name, parseFloat(value))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {param.values.map((value: any) => (
              <SelectItem key={value} value={value.toString()}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    } else if (param.type.includes("Numerical") && param.bounds) {
      // Continuous numerical - use input with min/max
      const [min, max] = param.bounds
      return (
        <div className="space-y-2">
          <Input
            type="number"
            min={min}
            max={max}
            step={0.01}
            value={manualInputs[param.name] || min}
            onChange={e =>
              handleManualInputChange(param.name, parseFloat(e.target.value))
            }
          />
          <div className="flex items-center gap-2">
            <span className="text-xs">{min}</span>
            <Slider
              min={min}
              max={max}
              step={(max - min) / 100}
              value={[manualInputs[param.name] || min]}
              onValueChange={values =>
                handleManualInputChange(param.name, values[0])
              }
            />
            <span className="text-xs">{max}</span>
          </div>
        </div>
      )
    } else if (param.type.includes("Categorical") && param.values) {
      // Categorical - use select
      return (
        <Select
          value={manualInputs[param.name]?.toString() || ""}
          onValueChange={value => handleManualInputChange(param.name, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {param.values.map((value: any) => (
              <SelectItem key={value} value={value.toString()}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Fallback to text input
    return (
      <Input
        value={manualInputs[param.name] || ""}
        onChange={e => handleManualInputChange(param.name, e.target.value)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Optimization Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{optimization.name}</CardTitle>
              <CardDescription>
                {optimization.description || "No description"}
              </CardDescription>
            </div>
            <Badge
              variant={optimization.status === "active" ? "default" : "outline"}
            >
              {optimization.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Target</h4>
              <div className="flex items-center text-lg font-semibold">
                {optimization.targetName}
                {optimization.targetMode === "MAX" ? (
                  <ArrowUp className="ml-1 size-4 text-green-500" />
                ) : (
                  <ArrowDown className="ml-1 size-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-medium">Best Result</h4>
              <div className="text-lg font-semibold">
                {bestPoint?.best_value !== undefined
                  ? parseFloat(bestPoint.best_value).toFixed(2)
                  : "No data"}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-medium">Measurements</h4>
              <div className="text-lg font-semibold">
                {measurementHistory.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Experiment Interface */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Column - Experiment Controls & Suggestions */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Controls</CardTitle>
              <CardDescription>
                Get suggestions and record results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <div className="text-muted-foreground text-xs">
                      Number of suggestions to generate
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 4, 8].map(size => (
                      <Button
                        key={size}
                        variant={batchSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBatchSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={getSuggestion}
                  disabled={loadingSuggestion}
                >
                  {loadingSuggestion ? (
                    <>
                      <RefreshCw className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Beaker className="mr-2 size-4" />
                      Get{" "}
                      {batchSize > 1
                        ? `${batchSize} Suggestions`
                        : "Suggestion"}
                    </>
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="manual-mode"
                    checked={manualMode}
                    onCheckedChange={setManualMode}
                  />
                  <Label htmlFor="manual-mode">Manual parameter entry</Label>
                  <HelpCircle className="text-muted-foreground size-4" />
                </div>
              </div>

              <Separator />

              {/* Manual Parameter Inputs */}
              {manualMode && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">
                    Manual Parameter Entry
                  </h3>
                  {optimization.config.parameters.map(param => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={param.name}>{param.name}</Label>
                      {renderParameterInput(param)}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestion Display */}
              {!manualMode && (
                <>
                  {suggestions.length > 0 ? (
                    <div className="space-y-4">
                      {suggestions.length > 1 && (
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">Suggestions</h3>
                          <div className="flex items-center space-x-2">
                            {suggestions.map((s, i) => (
                              <Button
                                key={i}
                                variant={
                                  s === activeSuggestion ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setActiveSuggestion(s)}
                              >
                                {i + 1}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSuggestion && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">
                              Suggested Parameters
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="divide-y">
                              {optimization.config.parameters.map(param => (
                                <div
                                  key={param.name}
                                  className="grid grid-cols-3 gap-1 py-2 text-sm"
                                >
                                  <dt className="font-medium">{param.name}</dt>
                                  <dd className="col-span-2 truncate">
                                    {formatParamValue(
                                      activeSuggestion[param.name],
                                      param
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Lightbulb className="mx-auto size-8 opacity-50" />
                      <h3 className="mt-2 font-medium">No Active Suggestion</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Click "Get Suggestion" to receive parameters for your
                        next experiment
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Result Entry & History */}
        <div className="space-y-6 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Record Result</CardTitle>
              <CardDescription>
                Enter the measurement result for the{" "}
                {manualMode ? "manual parameters" : "suggested parameters"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!manualMode && !activeSuggestion ? (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>No active suggestion</AlertTitle>
                  <AlertDescription>
                    Get a suggestion first before recording a result
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{optimization.targetName} Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter measurement result"
                              step="0.01"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the measured{" "}
                            {optimization.targetName.toLowerCase()} value
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 size-4" />
                          Record Result
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Measurement History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Measurement History</CardTitle>
                <CardDescription>Record of all experiments</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className={viewMode === "card" ? "bg-muted" : ""}
                >
                  <Grid className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-muted" : ""}
                >
                  <List className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchMeasurementHistory}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`size-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {measurementHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No measurements recorded yet
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "table" ? (
                    <div className="rounded-md border">
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader className="bg-background sticky top-0">
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Source</TableHead>
                              {optimization.config.parameters.map(param => (
                                <TableHead key={param.name}>
                                  {param.name}
                                </TableHead>
                              ))}
                              <TableHead className="text-right">
                                {optimization.targetName}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {measurementHistory.map(measurement => (
                              <TableRow key={measurement.id}>
                                <TableCell>
                                  {new Date(
                                    measurement.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      measurement.isRecommended
                                        ? "default"
                                        : "outline"
                                    }
                                  >
                                    {measurement.isRecommended
                                      ? "API"
                                      : "Manual"}
                                  </Badge>
                                </TableCell>
                                {optimization.config.parameters.map(param => (
                                  <TableCell key={param.name}>
                                    {formatParamValue(
                                      measurement.parameters[param.name],
                                      param
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right font-medium">
                                  {parseFloat(measurement.targetValue).toFixed(
                                    2
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {measurementHistory.slice(0, 4).map(measurement => (
                        <Card key={measurement.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 py-3">
                            <div className="flex items-center justify-between">
                              <div className="text-muted-foreground text-xs">
                                {new Date(
                                  measurement.createdAt
                                ).toLocaleString()}
                              </div>
                              <Badge
                                variant={
                                  measurement.isRecommended
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {measurement.isRecommended ? "API" : "Manual"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {optimization.targetName}
                              </div>
                              <div className="text-lg font-bold">
                                {parseFloat(measurement.targetValue).toFixed(2)}
                              </div>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {optimization.config.parameters
                                .slice(0, 4)
                                .map(param => (
                                  <div key={param.name} className="space-y-1">
                                    <div className="font-medium">
                                      {param.name}
                                    </div>
                                    <div>
                                      {formatParamValue(
                                        measurement.parameters[param.name],
                                        param
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {measurementHistory.length > 4 && viewMode === "card" && (
                    <Button
                      variant="link"
                      className="mt-2 w-full"
                      onClick={() => setViewMode("table")}
                    >
                      View all {measurementHistory.length} measurements
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Features */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Tools</CardTitle>
          <CardDescription>
            Additional features for experimentation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Import Data
          </Button>
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Export Results
          </Button>
          <Button variant="outline">
            <Clipboard className="mr-2 size-4" />
            Copy Best Parameters
          </Button>
          <Button variant="outline">
            <BarChart className="mr-2 size-4" />
            View Analytics
          </Button>
          <Button variant="outline">
            <Zap className="mr-2 size-4" />
            Run Auto-Optimization
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
