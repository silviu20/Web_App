"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  FileCog,
  Plus,
  Trash,
  RefreshCw,
  ChevronsUpDown,
  Info,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  MinusCircle,
  Copy,
  HelpCircle,
  ArrowRight
} from "lucide-react"

// Parameter type options
const parameterTypes = [
  { value: "NumericalContinuous", label: "Numerical (Continuous)" },
  { value: "NumericalDiscrete", label: "Numerical (Discrete)" },
  { value: "CategoricalParameter", label: "Categorical" },
  { value: "SubstanceParameter", label: "Substance" }
]

// Constraint type options
const constraintTypes = [
  { value: "LinearConstraint", label: "Linear Constraint" },
  { value: "NonlinearConstraint", label: "Nonlinear Constraint" },
  { value: "CardinalityConstraint", label: "Cardinality Constraint" },
  { value: "DiscreteSumConstraint", label: "Discrete Sum Constraint" },
  { value: "DiscreteProductConstraint", label: "Discrete Product Constraint" },
  {
    value: "DiscreteExcludeConstraint",
    label: "Exclude Combinations Constraint"
  },
  {
    value: "DiscreteLinkedParametersConstraint",
    label: "Linked Parameters Constraint"
  },
  {
    value: "DiscreteNoLabelDuplicatesConstraint",
    label: "No Duplicates Constraint"
  },
  {
    value: "DiscretePermutationInvarianceConstraint",
    label: "Permutation Invariance Constraint"
  },
  { value: "DiscreteDependenciesConstraint", label: "Dependencies Constraint" },
  { value: "DiscreteCustomConstraint", label: "Custom Constraint" }
]

// Recommender types
const recommenderTypes = [
  {
    value: "TwoPhaseMetaRecommender",
    label: "Two-Phase Meta Recommender (Default)"
  },
  { value: "BotorchRecommender", label: "Botorch Recommender" },
  { value: "FPSRecommender", label: "Furthest Point Sampling Recommender" },
  { value: "RandomRecommender", label: "Random Recommender" }
]

// Surrogate model types
const surrogateTypes = [
  { value: "GaussianProcessSurrogate", label: "Gaussian Process (Default)" },
  { value: "BayesianLinearSurrogate", label: "Bayesian Linear" },
  { value: "MeanPredictionSurrogate", label: "Mean Prediction" },
  { value: "NGBoostSurrogate", label: "NGBoost" },
  { value: "RandomForestSurrogate", label: "Random Forest" }
]

// Acquisition function types
const acquisitionTypes = [
  {
    value: "qLogExpectedImprovement",
    label: "Log Expected Improvement (Default)"
  },
  { value: "qExpectedImprovement", label: "Expected Improvement" },
  { value: "qProbabilityOfImprovement", label: "Probability of Improvement" },
  { value: "qUpperConfidenceBound", label: "Upper Confidence Bound" },
  { value: "qNoisyExpectedImprovement", label: "Noisy Expected Improvement" },
  {
    value: "qLogNoisyExpectedImprovement",
    label: "Log Noisy Expected Improvement"
  }
]

// Schema for form validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  parameters: z
    .array(
      z.object({
        name: z.string().min(1, "Parameter name is required"),
        type: z.string().min(1, "Parameter type is required"),
        values: z.string().optional(),
        lower: z.coerce.number().optional(),
        upper: z.coerce.number().optional(),
        tolerance: z.coerce.number().optional(),
        encoding: z.string().optional()
      })
    )
    .min(1, "At least one parameter is required"),
  target: z.object({
    name: z.string().min(1, "Target name is required"),
    mode: z.enum(["MAX", "MIN", "MATCH"]),
    lowerBound: z.coerce.number().optional(),
    upperBound: z.coerce.number().optional()
  }),
  objectiveType: z.enum(["SingleTarget", "Desirability"]),
  useConstraints: z.boolean().default(false),
  constraints: z
    .array(
      z.object({
        type: z.string(),
        parameters: z.array(z.string()).min(1, "Select at least one parameter"),
        constraint_details: z.string().optional()
      })
    )
    .optional(),
  useAdvancedOptions: z.boolean().default(false),
  recommenderType: z.string().default("TwoPhaseMetaRecommender"),
  surrogateType: z.string().default("GaussianProcessSurrogate"),
  acquisitionType: z.string().default("qLogExpectedImprovement"),
  useGPU: z.boolean().default(true)
})

export default function CreateOptimizationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      parameters: [
        { name: "", type: "NumericalContinuous", lower: 0, upper: 100 }
      ],
      target: {
        name: "Yield",
        mode: "MAX"
      },
      objectiveType: "SingleTarget",
      useConstraints: false,
      constraints: [],
      useAdvancedOptions: false,
      recommenderType: "TwoPhaseMetaRecommender",
      surrogateType: "GaussianProcessSurrogate",
      acquisitionType: "qLogExpectedImprovement",
      useGPU: true
    }
  })

  // Setup field arrays for parameters and constraints
  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter
  } = useFieldArray({
    control: form.control,
    name: "parameters"
  })

  const {
    fields: constraintFields,
    append: appendConstraint,
    remove: removeConstraint
  } = useFieldArray({
    control: form.control,
    name: "constraints"
  })

  // Watch form values to conditionally render fields
  const watchParameterTypes = form.watch("parameters")
  const watchUseConstraints = form.watch("useConstraints")
  const watchUseAdvancedOptions = form.watch("useAdvancedOptions")
  const watchObjectiveType = form.watch("objectiveType")
  const watchRecommenderType = form.watch("recommenderType")

  // Function to add a new parameter
  const handleAddParameter = () => {
    appendParameter({
      name: "",
      type: "NumericalContinuous",
      lower: 0,
      upper: 100
    })
  }

  // Function to add a new constraint
  const handleAddConstraint = () => {
    appendConstraint({
      type: "LinearConstraint",
      parameters: [],
      constraint_details: ""
    })
  }

  // Navigate between form steps
  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1)
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      // Transform form data to API format
      const formattedParameters = values.parameters.map(param => {
        const formattedParam: any = {
          name: param.name,
          type: param.type
        }

        // Handle different parameter types
        if (param.type === "NumericalContinuous") {
          formattedParam.bounds = [param.lower, param.upper]
        } else if (param.type === "NumericalDiscrete") {
          // Parse comma-separated values to array of numbers
          if (param.values) {
            formattedParam.values = param.values
              .split(",")
              .map(val => parseFloat(val.trim()))
            formattedParam.tolerance = param.tolerance || 0.1
          }
        } else if (
          param.type === "CategoricalParameter" ||
          param.type === "SubstanceParameter"
        ) {
          // Parse comma-separated values to array of strings
          if (param.values) {
            formattedParam.values = param.values
              .split(",")
              .map(val => val.trim())
            formattedParam.encoding = param.encoding || "OHE"
          }
        }

        return formattedParam
      })

      // Format target config based on objective type
      let targetConfig
      if (values.objectiveType === "SingleTarget") {
        targetConfig = {
          name: values.target.name,
          mode: values.target.mode
        }

        // Add bounds if provided
        if (
          values.target.lowerBound !== undefined ||
          values.target.upperBound !== undefined
        ) {
          targetConfig.bounds = {
            lower: values.target.lowerBound,
            upper: values.target.upperBound
          }
        }
      } else {
        // For multi-objective (not implementing fully in this demo)
        targetConfig = [
          {
            name: values.target.name,
            mode: values.target.mode,
            weight: 1.0
          }
        ]
      }

      // Format constraints if enabled
      let constraints = undefined
      if (
        values.useConstraints &&
        values.constraints &&
        values.constraints.length > 0
      ) {
        constraints = values.constraints.map(constraint => {
          // This is simplified - in a real app you'd need more complex transformation
          return {
            type: constraint.type,
            parameters: constraint.parameters,
            // Other constraint-specific properties would go here
            ...(constraint.constraint_details
              ? { description: constraint.constraint_details }
              : {})
          }
        })
      }

      // Format recommender config if advanced options enabled
      let recommenderConfig = undefined
      if (values.useAdvancedOptions) {
        recommenderConfig = {
          type: values.recommenderType
        }

        // Add surrogate model config if Botorch
        if (
          values.recommenderType === "BotorchRecommender" ||
          values.recommenderType === "TwoPhaseMetaRecommender"
        ) {
          recommenderConfig.surrogate_config = {
            type: values.surrogateType
          }

          recommenderConfig.acquisition_config = {
            type: values.acquisitionType
          }
        }
      }

      // Final API request payload
      const payload = {
        name: values.name,
        description: values.description || "",
        config: {
          parameters: formattedParameters,
          target_config: targetConfig,
          objective_type: values.objectiveType,
          recommender_config: recommenderConfig,
          constraints: constraints
        }
      }

      console.log("Submitting optimization:", payload)

      // In a real app, this would be an API call
      // const response = await fetch('/api/optimizations/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
      // const data = await response.json();

      // Simulate success response
      const data = { status: "success", optimizationId: "opt-" + Date.now() }

      if (data.status === "success") {
        toast({
          title: "Optimization created",
          description: "Your optimization has been created successfully"
        })

        // Redirect to optimization details page
        router.push(`/dashboard/optimizations/${data.optimizationId}`)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create optimization",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating optimization:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderParameterFields = (index: number, type: string) => {
    switch (type) {
      case "NumericalContinuous":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`parameters.${index}.lower`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lower Bound</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`parameters.${index}.upper`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upper Bound</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )

      case "NumericalDiscrete":
        return (
          <>
            <FormField
              control={form.control}
              name={`parameters.${index}.values`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Values (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1, 2, 5, 10, 20" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter discrete numerical values separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`parameters.${index}.tolerance`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tolerance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Tolerance for matching values (default: 0.1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )

      case "CategoricalParameter":
      case "SubstanceParameter":
        return (
          <>
            <FormField
              control={form.control}
              name={`parameters.${index}.values`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Values (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Red, Green, Blue" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter categorical values separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`parameters.${index}.encoding`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encoding</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select encoding" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OHE">
                        One-Hot Encoding (OHE)
                      </SelectItem>
                      <SelectItem value="Ordinal">Ordinal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How categorical values should be encoded
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )

      default:
        return null
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optimization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Catalyst Optimization"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objectiveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objective Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select objective type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SingleTarget">
                            Single Target
                          </SelectItem>
                          <SelectItem value="Desirability">
                            Desirability (Multi-Objective)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to handle optimization objectives
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the purpose of this optimization"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-medium">
                  Target Configuration
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="target.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Yield" {...field} />
                        </FormControl>
                        <FormDescription>
                          What you're trying to optimize
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target.mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Optimization Mode</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MAX">
                              <div className="flex items-center">
                                <ArrowUp className="mr-2 size-4 text-green-500" />
                                Maximize
                              </div>
                            </SelectItem>
                            <SelectItem value="MIN">
                              <div className="flex items-center">
                                <ArrowDown className="mr-2 size-4 text-red-500" />
                                Minimize
                              </div>
                            </SelectItem>
                            <SelectItem value="MATCH">
                              <div className="flex items-center">
                                <Info className="mr-2 size-4 text-blue-500" />
                                Match Target
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Whether to maximize, minimize, or match a target value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="target.lowerBound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lower Bound (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum expected value (leave empty if unknown)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target.upperBound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upper Bound (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum expected value (leave empty if unknown)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="useAdvancedOptions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Advanced Options
                      </FormLabel>
                      <FormDescription>
                        Configure recommender, surrogate model, and acquisition
                        function
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchUseAdvancedOptions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Advanced Configuration
                    </CardTitle>
                    <CardDescription>
                      Fine-tune optimization algorithm components
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="recommenderType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommender Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recommender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {recommenderTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Algorithm for suggesting next experiments
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(watchRecommenderType === "BotorchRecommender" ||
                      watchRecommenderType === "TwoPhaseMetaRecommender") && (
                      <>
                        <FormField
                          control={form.control}
                          name="surrogateType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Surrogate Model</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select surrogate model" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {surrogateTypes.map(type => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Model for approximating the objective function
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="acquisitionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Acquisition Function</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select acquisition function" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {acquisitionTypes.map(type => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Strategy for selecting next points
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="useGPU"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Use GPU Acceleration
                            </FormLabel>
                            <FormDescription>
                              Improves performance for complex optimizations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={goToNextStep}>
                Next: Define Parameters
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </>
        )

      case 2:
        return (
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Parameter Configuration</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddParameter}
                >
                  <Plus className="mr-2 size-4" />
                  Add Parameter
                </Button>
              </div>

              {parameterFields.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-muted-foreground mb-2">
                    No parameters defined
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddParameter}
                  >
                    <Plus className="mr-2 size-4" />
                    Add First Parameter
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {parameterFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Parameter {index + 1}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParameter(index)}
                            disabled={parameterFields.length <= 1}
                          >
                            <Trash className="size-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`parameters.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parameter Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Temperature"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Unique name for this parameter
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`parameters.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parameter Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {parameterTypes.map(type => (
                                      <SelectItem
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Render fields based on parameter type */}
                        {renderParameterFields(
                          index,
                          watchParameterTypes[index]?.type
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <FormField
                control={form.control}
                name="useConstraints"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Add Constraints
                      </FormLabel>
                      <FormDescription>
                        Define parameter constraints to ensure valid experiments
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchUseConstraints && (
                <Card>
                  <CardHeader className="flex items-start justify-between pb-3">
                    <div>
                      <CardTitle className="text-lg">Constraints</CardTitle>
                      <CardDescription>
                        Limit the search space to valid parameter combinations
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddConstraint}
                    >
                      <Plus className="mr-2 size-4" />
                      Add Constraint
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {constraintFields.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-center">
                        <p className="text-muted-foreground mb-2">
                          No constraints defined
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddConstraint}
                        >
                          <Plus className="mr-2 size-4" />
                          Add First Constraint
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {constraintFields.map((field, index) => (
                          <Card key={field.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  Constraint {index + 1}
                                </CardTitle>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeConstraint(index)}
                                >
                                  <Trash className="size-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <FormField
                                control={form.control}
                                name={`constraints.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Constraint Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {constraintTypes.map(type => (
                                          <SelectItem
                                            key={type.value}
                                            value={type.value}
                                          >
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`constraints.${index}.parameters`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Affected Parameters</FormLabel>
                                    <div className="space-y-2 rounded-md border p-3">
                                      {parameterFields.map(
                                        (param, paramIndex) => (
                                          <div
                                            key={param.id}
                                            className="flex items-center space-x-2"
                                          >
                                            <Checkbox
                                              checked={field.value?.includes(
                                                form.getValues(
                                                  `parameters.${paramIndex}.name`
                                                )
                                              )}
                                              onCheckedChange={checked => {
                                                const paramName =
                                                  form.getValues(
                                                    `parameters.${paramIndex}.name`
                                                  )
                                                const updatedParams = checked
                                                  ? [...field.value, paramName]
                                                  : field.value.filter(
                                                      p => p !== paramName
                                                    )
                                                field.onChange(updatedParams)
                                              }}
                                            />
                                            <label className="text-sm">
                                              {form.getValues(
                                                `parameters.${paramIndex}.name`
                                              ) ||
                                                `Parameter ${paramIndex + 1}`}
                                            </label>
                                          </div>
                                        )
                                      )}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`constraints.${index}.constraint_details`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Constraint Details</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Enter constraint details"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Specific details depend on the constraint
                                      type
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Optimization"
                )}
              </Button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Optimization</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/optimizations")}
        >
          Cancel
        </Button>
      </div>

      <div className="mb-8 flex justify-center">
        <ul className="flex w-full max-w-md">
          <li
            className={`flex-1 border-b-2 pb-4 text-center ${currentStep >= 1 ? "border-primary text-primary" : "text-muted-foreground border-gray-200"}`}
          >
            <span className="text-sm font-medium">Basic Info</span>
          </li>
          <li
            className={`flex-1 border-b-2 pb-4 text-center ${currentStep >= 2 ? "border-primary text-primary" : "text-muted-foreground border-gray-200"}`}
          >
            <span className="text-sm font-medium">
              Parameters & Constraints
            </span>
          </li>
        </ul>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {renderStepContent()}
        </form>
      </Form>
    </div>
  )
}
