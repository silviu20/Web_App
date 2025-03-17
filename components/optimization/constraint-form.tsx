// components/optimization/constraint-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import {
  Plus,
  Trash,
  Filter,
  ChevronDown,
  InfoIcon,
  Code,
  HelpCircle
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

// Constraint types
const constraintTypes = [
  {
    value: "LinearConstraint",
    label: "Linear Constraint",
    description:
      "Linear inequality constraint in the form: a₁x₁ + a₂x₂ + ... + aₙxₙ ≤ b"
  },
  {
    value: "NonlinearConstraint",
    label: "Nonlinear Constraint",
    description:
      "Complex constraint that can't be expressed as a linear equation"
  },
  {
    value: "CardinalityConstraint",
    label: "Cardinality Constraint",
    description: "Controls the number of active (non-zero) factors"
  },
  {
    value: "DiscreteSumConstraint",
    label: "Discrete Sum Constraint",
    description: "Ensures sum of discrete parameters meets certain conditions"
  },
  {
    value: "DiscreteProductConstraint",
    label: "Discrete Product Constraint",
    description:
      "Ensures product of discrete parameters meets certain conditions"
  },
  {
    value: "DiscreteExcludeConstraint",
    label: "Exclude Combinations Constraint",
    description: "Prevents specific parameter combinations"
  },
  {
    value: "DiscreteLinkedParametersConstraint",
    label: "Linked Parameters Constraint",
    description: "Forces parameters to have identical values"
  },
  {
    value: "DiscreteNoLabelDuplicatesConstraint",
    label: "No Duplicates Constraint",
    description: "Ensures no duplicate labels across parameters"
  },
  {
    value: "DiscretePermutationInvarianceConstraint",
    label: "Permutation Invariance Constraint",
    description: "Treats parameter orders as equivalent"
  },
  {
    value: "DiscreteDependenciesConstraint",
    label: "Dependencies Constraint",
    description: "Models dependencies between parameters"
  },
  {
    value: "DiscreteCustomConstraint",
    label: "Custom Constraint",
    description:
      "Define your own arbitrary constraint logic with a custom function"
  }
]

// Base constraint schema
const baseConstraintSchema = z.object({
  type: z.string().min(1, "Constraint type is required")
})

// Linear constraint schema
const linearConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("LinearConstraint"),
  coefficients: z.string().min(1, "Coefficients are required"),
  bound: z.string().min(1, "Bound is required"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Nonlinear constraint schema
const nonlinearConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("NonlinearConstraint"),
  formula: z.string().min(1, "Formula is required"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Cardinality constraint schema
const cardinalityConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("CardinalityConstraint"),
  min: z.string().min(1, "Minimum value is required"),
  max: z.string().min(1, "Maximum value is required"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Discrete sum constraint schema
const discreteSumConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteSumConstraint"),
  relation: z.enum(["EQ", "LE", "GE"]),
  bound: z.string().min(1, "Bound is required"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Discrete product constraint schema
const discreteProductConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteProductConstraint"),
  relation: z.enum(["EQ", "LE", "GE"]),
  bound: z.string().min(1, "Bound is required"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Exclude combinations constraint schema
const discreteExcludeConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteExcludeConstraint"),
  excludedCombinations: z.array(z.record(z.string())).optional(),
  excludedCombinationsText: z
    .string()
    .min(1, "At least one combination must be specified"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Linked parameters constraint schema
const discreteLinkedParametersConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteLinkedParametersConstraint"),
  parameterNames: z
    .array(z.string())
    .min(2, "At least two parameters must be selected")
})

// No label duplicates constraint schema
const discreteNoLabelDuplicatesConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteNoLabelDuplicatesConstraint"),
  parameterNames: z
    .array(z.string())
    .min(2, "At least two parameters must be selected")
})

// Permutation invariance constraint schema
const discretePermutationInvarianceConstraintSchema =
  baseConstraintSchema.extend({
    type: z.literal("DiscretePermutationInvarianceConstraint"),
    parameterNames: z
      .array(z.string())
      .min(2, "At least two parameters must be selected")
  })

// Dependencies constraint schema
const discreteDependenciesConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteDependenciesConstraint"),
  dependencies: z.string().min(1, "Dependencies are required"),
  parameterNames: z
    .array(z.string())
    .min(2, "At least two parameters must be selected")
})

// Custom constraint schema
const discreteCustomConstraintSchema = baseConstraintSchema.extend({
  type: z.literal("DiscreteCustomConstraint"),
  code: z.string().min(1, "Constraint code is required"),
  parameterNames: z
    .array(z.string())
    .min(1, "At least one parameter must be selected")
})

// Union of all constraint schemas

const constraintSchema = z.discriminatedUnion("type", [
  linearConstraintSchema,
  nonlinearConstraintSchema,
  cardinalityConstraintSchema,
  discreteSumConstraintSchema,
  discreteProductConstraintSchema,
  discreteExcludeConstraintSchema,
  discreteLinkedParametersConstraintSchema,
  discreteNoLabelDuplicatesConstraintSchema,
  discretePermutationInvarianceConstraintSchema,
  discreteDependenciesConstraintSchema,
  discreteCustomConstraintSchema
])

export interface ConstraintFormProps {
  parameters: any[]
  onAddConstraint: (constraint: any) => void
  existingConstraints?: any[]
  onRemoveConstraint?: (index: number) => void
}

export function ConstraintForm({
  parameters,
  onAddConstraint,
  existingConstraints = [],
  onRemoveConstraint
}: ConstraintFormProps) {
  const [constraintType, setConstraintType] = useState<string>("")
  const [excludedCombinations, setExcludedCombinations] = useState<
    Record<string, any>[]
  >([])
  const [paramValues, setParamValues] = useState<Record<string, any[]>>({})

  // Initialize form with a default constraint type
  const form = useForm<z.infer<typeof constraintSchema>>({
    resolver: zodResolver(constraintSchema),
    defaultValues: {
      type: "LinearConstraint",
      parameterNames: []
    } as any
  })

  // Initialize excluded combinations form
  const excludeForm = useForm({
    defaultValues: {
      combinations: [{}]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: excludeForm.control,
    name: "combinations"
  })

  // Watch for changes to constraint type
  const watchType = form.watch("type")
  const watchParameterNames = form.watch("parameterNames")

  // Extract unique values for each selected parameter
  useEffect(() => {
    if (watchParameterNames?.length > 0) {
      const values: Record<string, any[]> = {}

      watchParameterNames.forEach(name => {
        const param = parameters.find(p => p.name === name)
        if (
          param &&
          (param.type === "CategoricalParameter" ||
            param.type === "NumericalDiscrete") &&
          param.values
        ) {
          values[name] = param.values
        } else if (
          param &&
          param.type === "NumericalContinuous" &&
          param.bounds
        ) {
          // For continuous params, we'll just show min/max as examples
          values[name] = [param.bounds[0], param.bounds[1]]
        }
      })

      setParamValues(values)
    }
  }, [watchParameterNames, parameters])

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof constraintSchema>) => {
    try {
      // Process the form values based on constraint type
      let processedConstraint: any = { type: values.type }

      switch (values.type) {
        case "LinearConstraint":
          // Process coefficients string to array of numbers
          const coefficients = (values as any).coefficients
            .split(",")
            .map((c: string) => parseFloat(c.trim()))

          if (coefficients.some(isNaN)) {
            throw new Error("Coefficients must be valid numbers")
          }

          processedConstraint = {
            ...processedConstraint,
            coefficients,
            parameters: (values as any).parameterNames,
            bound: parseFloat((values as any).bound)
          }
          break

        case "NonlinearConstraint":
          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames,
            formula: (values as any).formula
          }
          break

        case "CardinalityConstraint":
          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames,
            min: parseInt((values as any).min, 10),
            max: parseInt((values as any).max, 10)
          }
          break

        case "DiscreteSumConstraint":
        case "DiscreteProductConstraint":
          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames,
            relation: (values as any).relation,
            bound: parseFloat((values as any).bound)
          }
          break

        case "DiscreteExcludeConstraint":
          // Process the excluded combinations from the text input
          let parsedCombinations: Record<string, any>[] = []

          try {
            if ((values as any).excludedCombinationsText) {
              // Try to parse the JSON or convert from a more user-friendly format
              const text = (values as any).excludedCombinationsText.trim()

              if (text.startsWith("[") && text.endsWith("]")) {
                // Attempt to parse as JSON array
                parsedCombinations = JSON.parse(text)
              } else {
                // Parse as comma-separated entries with key:value format
                const entries = text.split("\n").filter(e => e.trim())
                parsedCombinations = entries.map(entry => {
                  const pairs = entry.split(",").map(pair => pair.trim())
                  const obj: Record<string, any> = {}

                  pairs.forEach(pair => {
                    const [key, value] = pair.split(":").map(p => p.trim())
                    // Try to convert value to number if possible
                    const numValue = Number(value)
                    obj[key] = isNaN(numValue) ? value : numValue
                  })

                  return obj
                })
              }
            } else if (excludedCombinations.length > 0) {
              parsedCombinations = excludedCombinations
            }
          } catch (e) {
            throw new Error(
              "Invalid excluded combinations format. Use JSON array or 'param1:value1, param2:value2' format."
            )
          }

          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames,
            excludedCombinations: parsedCombinations
          }
          break

        case "DiscreteLinkedParametersConstraint":
        case "DiscreteNoLabelDuplicatesConstraint":
        case "DiscretePermutationInvarianceConstraint":
          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames
          }
          break

        case "DiscreteDependenciesConstraint":
          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames,
            dependencies: (values as any).dependencies
          }
          break

        case "DiscreteCustomConstraint":
          processedConstraint = {
            ...processedConstraint,
            parameters: (values as any).parameterNames,
            code: (values as any).code
          }
          break
      }

      // Call the onAddConstraint callback
      onAddConstraint(processedConstraint)

      // Reset the form
      form.reset({
        type: constraintType,
        parameterNames: []
      } as any)

      // Reset excluded combinations
      setExcludedCombinations([])

      toast({
        title: "Constraint Added",
        description: `Successfully added ${constraintType} constraint`
      })
    } catch (error) {
      console.error("Error adding constraint:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add constraint",
        variant: "destructive"
      })
    }
  }

  // Handle constraint type change
  const handleConstraintTypeChange = (type: string) => {
    setConstraintType(type)

    // Reset form with new constraint type
    form.reset({
      type,
      parameterNames: []
    } as any)

    // Reset excluded combinations
    setExcludedCombinations([])
  }

  // Add a new excluded combination
  const addExcludedCombination = () => {
    const newCombination: Record<string, any> = {}
    watchParameterNames?.forEach(param => {
      newCombination[param] = ""
    })

    setExcludedCombinations([...excludedCombinations, newCombination])
  }

  // Update an excluded combination
  const updateExcludedCombination = (
    index: number,
    param: string,
    value: any
  ) => {
    const updated = [...excludedCombinations]
    updated[index] = { ...updated[index], [param]: value }
    setExcludedCombinations(updated)
  }

  // Remove an excluded combination
  const removeExcludedCombination = (index: number) => {
    const updated = [...excludedCombinations]
    updated.splice(index, 1)
    setExcludedCombinations(updated)
  }

  // Format excluded combinations to text
  useEffect(() => {
    if (
      form.getValues("type") === "DiscreteExcludeConstraint" &&
      excludedCombinations.length > 0
    ) {
      const formattedText = excludedCombinations
        .map(combo =>
          Object.entries(combo)
            .filter(([_, value]) => value !== "")
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        )
        .join("\n")

      if (formattedText) {
        form.setValue("excludedCombinationsText", formattedText)
      }
    }
  }, [excludedCombinations, form])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 size-5" />
            Add Constraint
          </CardTitle>
          <CardDescription>
            Define constraints on parameter combinations to ensure valid
            experiments
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Constraint Type Selection */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Constraint Type</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value)
                        handleConstraintTypeChange(value)
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select constraint type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {constraintTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {
                        constraintTypes.find(t => t.value === watchType)
                          ?.description
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parameter Selection for the Constraint */}
              <FormField
                control={form.control}
                name="parameterNames"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Select Parameters</FormLabel>
                      <FormDescription>
                        Choose which parameters this constraint applies to
                      </FormDescription>
                    </div>
                    <div className="max-h-[200px] space-y-2 overflow-auto rounded-md border p-2">
                      {parameters.map(param => (
                        <div
                          key={param.name}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`param-${param.name}`}
                            checked={field.value?.includes(param.name)}
                            onCheckedChange={checked => {
                              const newValue = checked
                                ? [...(field.value || []), param.name]
                                : (field.value || []).filter(
                                    p => p !== param.name
                                  )
                              field.onChange(newValue)
                            }}
                          />
                          <label
                            htmlFor={`param-${param.name}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {param.name} ({param.type})
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Constraint-specific fields */}
              {watchType === "LinearConstraint" && (
                <>
                  <FormField
                    control={form.control}
                    name="coefficients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coefficients</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1, 2, 3, 4" {...field} />
                        </FormControl>
                        <FormDescription>
                          Comma-separated coefficients for each parameter
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bound</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Upper bound for the linear constraint
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {watchType === "NonlinearConstraint" && (
                <FormField
                  control={form.control}
                  name="formula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formula</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., x1^2 + x2^2 <= 10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A formula representing the nonlinear constraint. Use
                        parameter names as variables.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchType === "CardinalityConstraint" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g., 1"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum number of non-zero parameters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g., 3"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of non-zero parameters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {(watchType === "DiscreteSumConstraint" ||
                watchType === "DiscreteProductConstraint") && (
                <>
                  <FormField
                    control={form.control}
                    name="relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relation</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EQ">Equal (=)</SelectItem>
                            <SelectItem value="LE">
                              Less than or equal (≤)
                            </SelectItem>
                            <SelectItem value="GE">
                              Greater than or equal (≥)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Relation between the{" "}
                          {watchType === "DiscreteSumConstraint"
                            ? "sum"
                            : "product"}{" "}
                          and the bound
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bound</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Value that the{" "}
                          {watchType === "DiscreteSumConstraint"
                            ? "sum"
                            : "product"}{" "}
                          should be compared against
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {watchType === "DiscreteExcludeConstraint" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel>Excluded Combinations</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExcludedCombination}
                        disabled={watchParameterNames?.length === 0}
                      >
                        <Plus className="mr-1 size-4" />
                        Add Combination
                      </Button>
                    </div>

                    {watchParameterNames?.length === 0 ? (
                      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                        Select parameters first to define excluded combinations
                      </div>
                    ) : excludedCombinations.length > 0 ? (
                      <div className="space-y-3">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {watchParameterNames?.map(param => (
                                  <TableHead key={param}>{param}</TableHead>
                                ))}
                                <TableHead className="w-[100px]">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {excludedCombinations.map((combo, index) => (
                                <TableRow key={index}>
                                  {watchParameterNames?.map(param => (
                                    <TableCell key={param}>
                                      <Select
                                        value={
                                          combo[param] !== undefined
                                            ? String(combo[param])
                                            : ""
                                        }
                                        onValueChange={value =>
                                          updateExcludedCombination(
                                            index,
                                            param,
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Any value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">
                                            Any value
                                          </SelectItem>
                                          {paramValues[param]?.map(
                                            (val: any) => (
                                              <SelectItem
                                                key={val}
                                                value={String(val)}
                                              >
                                                {val}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  ))}
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeExcludedCombination(index)
                                      }
                                    >
                                      <Trash className="size-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <FormDescription>
                          Define combinations of parameter values that should be
                          excluded from the search space
                        </FormDescription>
                      </div>
                    ) : (
                      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                        Click "Add Combination" to define a parameter
                        combination to exclude
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="excludedCombinationsText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Advanced: Combinations as Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="param1: value1, param2: value2
param1: value3, param2: value4"
                              {...field}
                              rows={5}
                            />
                          </FormControl>
                          <FormDescription>
                            You can also manually specify combinations as text.
                            Each line represents one combination.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {watchType === "DiscreteLinkedParametersConstraint" && (
                <div className="rounded-md border border-dashed bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-muted-foreground mb-2 text-sm">
                    This constraint will force all selected parameters to have
                    the same values. Make sure to select parameters of the same
                    type.
                  </p>
                  {watchParameterNames?.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">Selected parameters:</p>
                      <p className="text-muted-foreground">
                        {watchParameterNames.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {watchType === "DiscreteNoLabelDuplicatesConstraint" && (
                <div className="rounded-md border border-dashed bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-muted-foreground mb-2 text-sm">
                    This constraint ensures that no duplicate values are allowed
                    across the selected parameters. This is useful when
                    parameters must have distinct values.
                  </p>
                  {watchParameterNames?.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">Selected parameters:</p>
                      <p className="text-muted-foreground">
                        {watchParameterNames.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {watchType === "DiscretePermutationInvarianceConstraint" && (
                <div className="rounded-md border border-dashed bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-muted-foreground mb-2 text-sm">
                    This constraint treats the selected parameters as
                    order-invariant. This is useful for situations where the
                    order of parameters doesn't matter, such as in mixture
                    experiments.
                  </p>
                  {watchParameterNames?.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">Selected parameters:</p>
                      <p className="text-muted-foreground">
                        {watchParameterNames.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {watchType === "DiscreteDependenciesConstraint" && (
                <FormField
                  control={form.control}
                  name="dependencies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependencies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A: [B, C], B: [D]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Define dependencies between parameters in the format
                        "param1: [param2, param3]". This means param1 depends on
                        param2 and param3.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchType === "DiscreteCustomConstraint" && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Custom Constraint Function
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="ml-1 size-4 cursor-help opacity-70" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                              <p>
                                Write a Python function that takes a dictionary
                                of parameter values and returns True if the
                                constraint is satisfied, False otherwise.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`def custom_constraint(parameter_values):
    # Example: Ensure that if param_a > 10, then param_b must be < 5
    if parameter_values["param_a"] > 10 and parameter_values["param_b"] >= 5:
        return False
    return True`}
                          {...field}
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription className="flex items-center">
                        <Code className="mr-1 size-4" />
                        Define a Python function that evaluates your custom
                        constraint logic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>

            <CardFooter>
              <Button type="submit">
                <Plus className="mr-2 size-4" />
                Add Constraint
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Existing Constraints */}
      {existingConstraints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Existing Constraints ({existingConstraints.length})
            </CardTitle>
            <CardDescription>
              Current constraints applied to the optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {existingConstraints.map((constraint, index) => (
                <AccordionItem key={index} value={`constraint-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <span className="text-base font-medium">
                        {constraintTypes.find(t => t.value === constraint.type)
                          ?.label || constraint.type}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-muted-foreground space-y-2 pb-2 text-sm">
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {constraint.type}
                      </p>
                      <p>
                        <span className="font-medium">Parameters:</span>{" "}
                        {Array.isArray(constraint.parameters)
                          ? constraint.parameters.join(", ")
                          : "No parameters specified"}
                      </p>

                      {/* Constraint-specific details */}
                      {constraint.type === "LinearConstraint" && (
                        <>
                          <p>
                            <span className="font-medium">Coefficients:</span>{" "}
                            {Array.isArray(constraint.coefficients)
                              ? constraint.coefficients.join(", ")
                              : constraint.coefficients}
                          </p>
                          <p>
                            <span className="font-medium">Bound:</span>{" "}
                            {constraint.bound}
                          </p>
                        </>
                      )}

                      {constraint.type === "NonlinearConstraint" && (
                        <p>
                          <span className="font-medium">Formula:</span>{" "}
                          {constraint.formula}
                        </p>
                      )}

                      {constraint.type === "CardinalityConstraint" && (
                        <>
                          <p>
                            <span className="font-medium">Minimum:</span>{" "}
                            {constraint.min}
                          </p>
                          <p>
                            <span className="font-medium">Maximum:</span>{" "}
                            {constraint.max}
                          </p>
                        </>
                      )}

                      {(constraint.type === "DiscreteSumConstraint" ||
                        constraint.type === "DiscreteProductConstraint") && (
                        <>
                          <p>
                            <span className="font-medium">Relation:</span>{" "}
                            {constraint.relation === "EQ"
                              ? "="
                              : constraint.relation === "LE"
                                ? "≤"
                                : "≥"}
                          </p>
                          <p>
                            <span className="font-medium">Bound:</span>{" "}
                            {constraint.bound}
                          </p>
                        </>
                      )}

                      {constraint.type === "DiscreteExcludeConstraint" &&
                        constraint.excludedCombinations && (
                          <div>
                            <span className="font-medium">
                              Excluded Combinations:
                            </span>
                            <div className="mt-1 rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {constraint.parameters?.map(
                                      (param: string) => (
                                        <TableHead key={param}>
                                          {param}
                                        </TableHead>
                                      )
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {constraint.excludedCombinations.map(
                                    (
                                      combo: Record<string, any>,
                                      idx: number
                                    ) => (
                                      <TableRow key={idx}>
                                        {constraint.parameters?.map(
                                          (param: string) => (
                                            <TableCell key={param}>
                                              {combo[param] !== undefined
                                                ? String(combo[param])
                                                : "*"}
                                            </TableCell>
                                          )
                                        )}
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                      {constraint.type === "DiscreteDependenciesConstraint" && (
                        <p>
                          <span className="font-medium">Dependencies:</span>{" "}
                          {constraint.dependencies}
                        </p>
                      )}

                      {constraint.type === "DiscreteCustomConstraint" && (
                        <div>
                          <span className="font-medium">Custom Code:</span>
                          <pre className="mt-1 max-h-[150px] overflow-auto rounded-md bg-slate-100 p-2 text-xs dark:bg-slate-800">
                            {constraint.code}
                          </pre>
                        </div>
                      )}
                    </div>

                    {onRemoveConstraint && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemoveConstraint(index)}
                      >
                        <Trash className="mr-2 size-4" />
                        Remove Constraint
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <InfoIcon className="mr-2 size-5" />
            About Constraints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              Constraints help ensure that only valid parameter combinations are
              suggested for experimentation. This is especially important when:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Some parameter combinations are physically impossible</li>
              <li>
                You need to enforce specific relationships between parameters
              </li>
              <li>
                You want to limit the active components in a mixture experiment
              </li>
              <li>
                There are budget or resource constraints for your experiments
              </li>
            </ul>
            <p className="pt-2">
              Properly defined constraints will prevent the recommender from
              suggesting invalid experiments, saving time and resources.
            </p>
            <p className="pt-1">
              The BayBE framework supports a wide range of constraint types,
              from simple linear constraints to complex custom logic. Choose the
              constraint type that best models your experimental requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
