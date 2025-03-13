// components/optimization/multi-objective-form.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Target,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Target schema
const targetSchema = z.object({
  name: z.string().min(1, "Target name is required"),
  mode: z.enum(["MAX", "MIN", "MATCH"], {
    required_error: "Optimization mode is required"
  }),
  weight: z.number().min(0, "Weight must be non-negative").optional(),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional()
})

// Schema for the form validation
const formSchema = z.object({
  name: z.string().min(1, "Target name is required"),
  mode: z.enum(["MAX", "MIN", "MATCH"]),
  weight: z.coerce.number().min(0, "Weight must be non-negative").default(1),
  lowerBound: z.coerce.number().optional(),
  upperBound: z.coerce.number().optional()
})

// Schema for the objective type
const objectiveTypeSchema = z.object({
  type: z.enum(["single", "desirability", "pareto"])
})

export interface MultiObjectiveFormProps {
  onAddTarget: (target: any) => void
  onRemoveTarget: (index: number) => void
  onObjectiveTypeChange: (type: string) => void
  existingTargets: any[]
  currentObjectiveType: string
}

export function MultiObjectiveForm({
  onAddTarget,
  onRemoveTarget,
  onObjectiveTypeChange,
  existingTargets = [],
  currentObjectiveType = "single"
}: MultiObjectiveFormProps) {
  const [showBounds, setShowBounds] = useState(false)

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mode: "MAX",
      weight: 1
    }
  })

  // Initialize the objective type form
  const objectiveTypeForm = useForm<z.infer<typeof objectiveTypeSchema>>({
    resolver: zodResolver(objectiveTypeSchema),
    defaultValues: {
      type: currentObjectiveType as any
    }
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Process the form values
      const target = {
        name: values.name,
        mode: values.mode,
        weight: values.weight
      }

      // Add bounds if they are provided
      if (showBounds) {
        if (
          values.lowerBound !== undefined &&
          values.upperBound !== undefined
        ) {
          if (values.lowerBound >= values.upperBound) {
            toast({
              title: "Invalid bounds",
              description: "Lower bound must be less than upper bound",
              variant: "destructive"
            })
            return
          }

          // @ts-ignore
          target.bounds = [values.lowerBound, values.upperBound]
        }
      }

      // Call the onAddTarget callback
      onAddTarget(target)

      // Reset the form
      form.reset({
        name: "",
        mode: "MAX",
        weight: 1,
        lowerBound: undefined,
        upperBound: undefined
      })

      toast({
        title: "Target Added",
        description: `Successfully added ${values.name} target`
      })
    } catch (error) {
      console.error("Error adding target:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add target",
        variant: "destructive"
      })
    }
  }

  // Handle objective type change
  const handleObjectiveTypeChange = (
    values: z.infer<typeof objectiveTypeSchema>
  ) => {
    onObjectiveTypeChange(values.type)
  }

  // Check if we have multiple targets defined
  const hasMultipleTargets = existingTargets.length > 1

  return (
    <div className="space-y-6">
      {/* Objective Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 size-5" />
            Objective Configuration
          </CardTitle>
          <CardDescription>
            Define your optimization objectives and how they should be handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...objectiveTypeForm}>
            <form
              onChange={objectiveTypeForm.handleSubmit(
                handleObjectiveTypeChange
              )}
              className="space-y-4"
            >
              <FormField
                control={objectiveTypeForm.control}
                name="type"
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
                        <SelectItem value="single">Single Target</SelectItem>
                        <SelectItem value="desirability">
                          Desirability (Weighted Combination)
                        </SelectItem>
                        <SelectItem value="pareto">
                          Pareto Front (Multi-objective)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "single"
                        ? "Optimize a single target objective"
                        : field.value === "desirability"
                          ? "Combine multiple targets into a single scalar objective with weights"
                          : "Find solutions that represent optimal trade-offs between conflicting objectives"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {currentObjectiveType !== "single" &&
            existingTargets.length === 0 && (
              <Alert className="mt-4">
                <AlertCircle className="size-4" />
                <AlertTitle>Multiple targets required</AlertTitle>
                <AlertDescription>
                  Please add at least two targets for{" "}
                  {currentObjectiveType === "desirability"
                    ? "desirability"
                    : "Pareto"}{" "}
                  optimization.
                </AlertDescription>
              </Alert>
            )}

          {currentObjectiveType === "single" && existingTargets.length > 1 && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Too many targets</AlertTitle>
              <AlertDescription>
                Single objective optimization supports only one target. Please
                remove additional targets or change the objective type.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add Target Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Target</CardTitle>
          <CardDescription>
            Define a target variable to optimize
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Target Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Yield, Purity, Cost"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The output variable you want to optimize
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optimization Mode */}
              <FormField
                control={form.control}
                name="mode"
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
                            <ArrowDown className="mr-2 size-4 text-green-500" />
                            Minimize
                          </div>
                        </SelectItem>
                        <SelectItem value="MATCH">
                          <div className="flex items-center">Target Value</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "MAX"
                        ? "Find parameter values that maximize the target"
                        : field.value === "MIN"
                          ? "Find parameter values that minimize the target"
                          : "Find parameter values that match a target value"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Weight (for multi-objective) */}
              {currentObjectiveType === "desirability" && (
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Weight: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={values => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Higher weights give more importance to this target in
                        the combined objective
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Target Bounds */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-bounds"
                    checked={showBounds}
                    onChange={e => setShowBounds(e.target.checked)}
                    className="size-4 rounded border-gray-300"
                  />
                  <label htmlFor="show-bounds" className="text-sm font-medium">
                    Specify Target Bounds
                  </label>
                </div>

                {showBounds && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lowerBound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lower Bound</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Minimum value"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="upperBound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upper Bound</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Maximum value"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormDescription>
                  Target bounds help with normalization in multi-objective
                  optimization
                </FormDescription>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit">
                <Plus className="mr-2 size-4" />
                Add Target
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Existing Targets */}
      {existingTargets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Defined Targets ({existingTargets.length})</CardTitle>
            <CardDescription>
              Targets currently defined for this optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mode</TableHead>
                  {currentObjectiveType === "desirability" && (
                    <TableHead>Weight</TableHead>
                  )}
                  <TableHead>Bounds</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingTargets.map((target, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{target.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {target.mode === "MAX" ? (
                          <>
                            <ArrowUp className="mr-1 size-4 text-green-500" />
                            Maximize
                          </>
                        ) : target.mode === "MIN" ? (
                          <>
                            <ArrowDown className="mr-1 size-4 text-green-500" />
                            Minimize
                          </>
                        ) : (
                          "Match"
                        )}
                      </div>
                    </TableCell>
                    {currentObjectiveType === "desirability" && (
                      <TableCell>{target.weight || 1}</TableCell>
                    )}
                    <TableCell>
                      {target.bounds
                        ? `[${target.bounds[0]}, ${target.bounds[1]}]`
                        : "Not specified"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveTarget(index)}
                      >
                        <Trash className="size-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
