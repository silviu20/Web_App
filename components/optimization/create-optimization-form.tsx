// components/optimization/create-optimization-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  FileCog,
  Info,
  Loader2,
  Plus,
  Target,
  Trash,
  X,
  ArrowDown,
  ArrowUp,
  Settings
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { createAdvancedOptimizationWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { ConstraintForm } from "./constraint-form"

// Validation schema for the form
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  parameters: z
    .array(
      z.object({
        name: z.string().min(1, "Parameter name is required"),
        type: z.string().min(1, "Parameter type is required"),
        values: z.array(z.union([z.string(), z.number()])).optional(),
        bounds: z.tuple([z.number(), z.number()]).optional(),
        encoding: z.string().optional(),
        tolerance: z.number().optional(),
        description: z.string().optional()
      })
    )
    .min(1, "At least one parameter is required"),
  targets: z
    .array(
      z.object({
        name: z.string().min(1, "Target name is required"),
        mode: z.enum(["MAX", "MIN", "MATCH"]),
        bounds: z.tuple([z.number(), z.number()]).optional(),
        weight: z.number().optional()
      })
    )
    .min(1, "At least one target is required"),
  objectiveType: z.enum(["single", "desirability", "pareto"]).default("single"),
  recommenderType: z.string().optional(),
  acquisitionFunction: z.string().optional(),
  useAdvancedOptions: z.boolean().default(false)
})

// Type for the form values
type FormValues = z.infer<typeof formSchema>

export function CreateOptimizationForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [constraints, setConstraints] = useState<any[]>([])

  // Initialize form with defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      parameters: [
        {
          name: "",
          type: "NumericalContinuous",
          bounds: [0, 100]
        }
      ],
      targets: [
        {
          name: "Target",
          mode: "MAX"
        }
      ],
      objectiveType: "single",
      useAdvancedOptions: false
    }
  })

  // Field arrays for parameters and targets
  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter,
    replace: replaceParameters
  } = useFieldArray({
    control: form.control,
    name: "parameters"
  })

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget
  } = useFieldArray({
    control: form.control,
    name: "targets"
  })

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // Prepare the configuration
      const config: any = {
        parameters: values.parameters,
        targets: values.targets,
        constraints: constraints.length > 0 ? constraints : undefined
      }

      // Add advanced configuration if enabled
      if (values.useAdvancedOptions) {
        if (values.objectiveType) {
          config.objectiveType = values.objectiveType
        }

        if (values.recommenderType) {
          config.recommenderType = values.recommenderType
        }

        if (values.acquisitionFunction) {
          config.acquisitionFunction = values.acquisitionFunction
        }
      }

      // Create optimization
      const result = await createAdvancedOptimizationWorkflowAction(
        values.name,
        values.description || "",
        config
      )

      if (result.isSuccess && result.data) {
        toast({
          title: "Optimization Created",
          description: "Your optimization has been created successfully"
        })

        // Redirect to the new optimization
        router.push(`/dashboard/optimizations/${result.data.id}`)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating optimization:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Parameter type options
  const parameterTypes = [
    { value: "NumericalContinuous", label: "Numerical (Continuous)" },
    { value: "NumericalDiscrete", label: "Numerical (Discrete)" },
    { value: "CategoricalParameter", label: "Categorical" }
  ]

  // Recommender type options
  const recommenderTypes = [
    { value: "BotorchRecommender", label: "Botorch (Default)" },
    { value: "RandomRecommender", label: "Random Search" },
    { value: "FPSRecommender", label: "Farthest Point Sampling" },
    { value: "TwoPhaseMetaRecommender", label: "Two-Phase Meta Recommender" }
  ]

  // Acquisition function options
  const acquisitionFunctions = [
    {
      value: "qLogExpectedImprovement",
      label: "Log Expected Improvement (Default)"
    },
    { value: "qExpectedImprovement", label: "Expected Improvement" },
    { value: "qProbabilityOfImprovement", label: "Probability of Improvement" },
    { value: "qUpperConfidenceBound", label: "Upper Confidence Bound" }
  ]

  // Handle parameter type change
  const handleParameterTypeChange = (type: string, index: number) => {
    const currentParams = form.getValues("parameters")
    const param = currentParams[index]

    // Update defaults based on parameter type
    if (type === "NumericalContinuous") {
      param.bounds = param.bounds || [0, 100]
      delete param.values
    } else if (type === "NumericalDiscrete") {
      param.values = param.values || [0, 1, 2, 3, 4, 5]
      delete param.bounds
    } else if (type === "CategoricalParameter") {
      param.values = param.values || ["A", "B", "C"]
      delete param.bounds
    }

    // Update the parameter
    param.type = type
    replaceParameters(currentParams)
  }

  // Add a constraint
  const addConstraint = (constraint: any) => {
    setConstraints([...constraints, constraint])
    toast({
      title: "Constraint Added",
      description: `${constraint.type} constraint added successfully`
    })
  }

  // Remove a constraint
  const removeConstraint = (index: number) => {
    const updatedConstraints = [...constraints]
    updatedConstraints.splice(index, 1)
    setConstraints(updatedConstraints)
    toast({
      title: "Constraint Removed",
      description: "Constraint removed successfully"
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCog className="mr-2 size-5" />
            Create New Optimization
          </CardTitle>
          <CardDescription>
            Configure your optimization by specifying parameters, targets, and
            settings.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardContent>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
              </CardContent>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <CardContent className="space-y-6">
                  {/* Name and Description */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Optimization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a name..." {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for your optimization project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter a description..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of what you're optimizing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Configuration */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium">Target(s)</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendTarget({ name: "", mode: "MAX" })}
                      >
                        <Plus className="mr-1 size-4" />
                        Add Target
                      </Button>
                    </div>

                    {targetFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="mb-6 rounded-md border p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="font-medium">
                            Target #{index + 1}
                            {index === 0 && (
                              <Badge variant="outline" className="ml-2">
                                Primary
                              </Badge>
                            )}
                          </h4>
                          {targetFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTarget(index)}
                            >
                              <Trash className="size-4 text-red-500" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`targets.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Yield, Efficiency..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`targets.${index}.mode`}
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
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Whether to maximize or minimize this target
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("parameters")}
                    >
                      Next: Configure Parameters
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Parameters Tab */}
              <TabsContent value="parameters" className="space-y-6">
                <CardContent className="space-y-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Parameters</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendParameter({
                          name: "",
                          type: "NumericalContinuous",
                          bounds: [0, 100]
                        })
                      }
                    >
                      <Plus className="mr-1 size-4" />
                      Add Parameter
                    </Button>
                  </div>

                  {parameterFields.map((field, index) => (
                    <div key={field.id} className="rounded-md border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-medium">Parameter #{index + 1}</h4>
                        {parameterFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParameter(index)}
                          >
                            <Trash className="size-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parameter Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Temperature, Pressure..."
                                  {...field}
                                />
                              </FormControl>
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
                                onValueChange={value => {
                                  field.onChange(value)
                                  handleParameterTypeChange(value, index)
                                }}
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

                      {/* Render bounds for continuous parameters */}
                      {form.watch(`parameters.${index}.type`) ===
                        "NumericalContinuous" && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`parameters.${index}.bounds.0`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lower Bound</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...field}
                                    onChange={e =>
                                      field.onChange(parseFloat(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`parameters.${index}.bounds.1`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Upper Bound</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...field}
                                    onChange={e =>
                                      field.onChange(parseFloat(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Render values for discrete parameters */}
                      {(form.watch(`parameters.${index}.type`) ===
                        "NumericalDiscrete" ||
                        form.watch(`parameters.${index}.type`) ===
                          "CategoricalParameter") && (
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.values`}
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Values</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    form.watch(`parameters.${index}.type`) ===
                                    "NumericalDiscrete"
                                      ? "e.g., 1, 2, 3, 4, 5"
                                      : "e.g., Red, Green, Blue"
                                  }
                                  value={field.value?.join(", ") || ""}
                                  onChange={e => {
                                    const valuesStr = e.target.value
                                    const values = valuesStr
                                      .split(",")
                                      .map(v => v.trim())
                                      .filter(v => v)
                                      .map(v => {
                                        // Convert to number if NumericalDiscrete
                                        if (
                                          form.watch(
                                            `parameters.${index}.type`
                                          ) === "NumericalDiscrete" &&
                                          !isNaN(parseFloat(v))
                                        ) {
                                          return parseFloat(v)
                                        }
                                        return v
                                      })
                                    field.onChange(values)
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter values separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  ))}

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("advanced")}
                    >
                      Next: Advanced Settings
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <CardContent className="space-y-6">
                  {/* Advanced Options Toggle */}
                  <FormField
                    control={form.control}
                    name="useAdvancedOptions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Advanced Options</FormLabel>
                          <FormDescription>
                            Configure advanced optimization settings
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Advanced Options */}
                  {form.watch("useAdvancedOptions") && (
                    <div className="space-y-6 rounded-md border p-4">
                      {/* Multi-objective settings */}
                      {targetFields.length > 1 && (
                        <FormField
                          control={form.control}
                          name="objectiveType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Multi-objective Strategy</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select strategy" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="single">
                                    Single Target (Primary Only)
                                  </SelectItem>
                                  <SelectItem value="desirability">
                                    Desirability (Weighted Sum)
                                  </SelectItem>
                                  <SelectItem value="pareto">
                                    Pareto Optimization
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                How to handle multiple optimization targets
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Recommender settings */}
                      <FormField
                        control={form.control}
                        name="recommenderType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recommender Algorithm</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Default (Auto-select)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">
                                  Default (Auto-select)
                                </SelectItem>
                                {recommenderTypes.map(type => (
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
                              Algorithm used to recommend parameter values
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Acquisition function settings */}
                      <FormField
                        control={form.control}
                        name="acquisitionFunction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Acquisition Function</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Default (Auto-select)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">
                                  Default (Auto-select)
                                </SelectItem>
                                {acquisitionFunctions.map(func => (
                                  <SelectItem
                                    key={func.value}
                                    value={func.value}
                                  >
                                    {func.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Strategy for balancing exploration vs exploitation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Constraints */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Constraints</h3>

                    {constraints.length > 0 && (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Type</TableHead>
                              <TableHead>Parameters</TableHead>
                              <TableHead className="w-[100px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {constraints.map((constraint, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {constraint.type}
                                </TableCell>
                                <TableCell>
                                  {Array.isArray(constraint.parameters)
                                    ? constraint.parameters.join(", ")
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeConstraint(idx)}
                                  >
                                    <Trash className="size-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <Accordion type="single" collapsible>
                      <AccordionItem value="add-constraint">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Plus className="mr-2 size-4" />
                            Add Constraint
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ConstraintForm
                            parameters={form.getValues("parameters")}
                            onAddConstraint={addConstraint}
                            existingConstraints={constraints}
                            onRemoveConstraint={removeConstraint}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>

            <CardFooter className="flex justify-between border-t p-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard/optimizations")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 size-4" />
                    Create Optimization
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
