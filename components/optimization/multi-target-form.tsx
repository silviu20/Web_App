// components/optimization/multi-target-form.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import {
  Plus,
  Trash,
  Target,
  MoveHorizontal,
  Maximize,
  Minimize
} from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"

// Schema for a single target
const targetSchema = z.object({
  name: z.string().min(1, "Target name is required"),
  mode: z.enum(["MAX", "MIN", "MATCH"], {
    required_error: "Please select a target mode"
  }),
  weight: z.number().min(0).max(10).default(1),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional()
})

// Schema for the form with multiple targets
const targetsFormSchema = z.object({
  targets: z
    .array(targetSchema)
    .min(1, "At least one target is required")
    .max(5, "Maximum 5 targets allowed"),
  objectiveType: z
    .enum(["single", "desirability", "pareto"], {
      required_error: "Please select an objective type"
    })
    .default("single")
})

export interface MultiTargetFormProps {
  onSubmit: (data: z.infer<typeof targetsFormSchema>) => void
  defaultValues?: z.infer<typeof targetsFormSchema>
}

export function MultiTargetForm({
  onSubmit,
  defaultValues
}: MultiTargetFormProps) {
  // Initialize the form with default values
  const form = useForm<z.infer<typeof targetsFormSchema>>({
    resolver: zodResolver(targetsFormSchema),
    defaultValues: defaultValues || {
      targets: [{ name: "", mode: "MAX", weight: 1 }],
      objectiveType: "single"
    }
  })

  // Access the targets field array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "targets"
  })

  // Watch the targets array to determine the objective type options
  const targets = useWatch({
    control: form.control,
    name: "targets"
  })

  // Watch the objective type
  const objectiveType = useWatch({
    control: form.control,
    name: "objectiveType"
  })

  // Handle adding a new target
  const handleAddTarget = () => {
    if (fields.length < 5) {
      append({ name: "", mode: "MAX", weight: 1 })
    }
  }

  // Handle removing a target
  const handleRemoveTarget = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  // Handle form submission
  const handleSubmit = (data: z.infer<typeof targetsFormSchema>) => {
    // Process the targets data
    const processedTargets = data.targets.map(target => {
      const processed: any = {
        name: target.name,
        mode: target.mode,
        weight: target.weight
      }

      // Add bounds for MATCH mode
      if (
        target.mode === "MATCH" &&
        target.lowerBound !== undefined &&
        target.upperBound !== undefined
      ) {
        processed.bounds = [target.lowerBound, target.upperBound]
      }

      return processed
    })

    // Call the onSubmit callback with processed data
    onSubmit({
      targets: processedTargets,
      objectiveType: data.objectiveType
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 size-5" />
              Define Optimization Targets
            </CardTitle>
            <CardDescription>
              Specify what you want to optimize. You can add up to 5 targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Fields */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="overflow-hidden border-dashed">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Target {index + 1}
                      </CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTarget(index)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 pt-2">
                    {/* Target Name */}
                    <FormField
                      control={form.control}
                      name={`targets.${index}.name`}
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
                            Name of the output metric you want to optimize
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Mode */}
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
                                <SelectValue placeholder="Select the optimization mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem
                                value="MAX"
                                className="flex items-center"
                              >
                                <Maximize className="mr-2 size-4" />
                                Maximize
                              </SelectItem>
                              <SelectItem value="MIN">
                                <Minimize className="mr-2 size-4" />
                                Minimize
                              </SelectItem>
                              <SelectItem value="MATCH">
                                <MoveHorizontal className="mr-2 size-4" />
                                Match Target Value
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Do you want to maximize, minimize, or match a
                            specific value?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Bounds (for MATCH mode) */}
                    {form.watch(`targets.${index}.mode`) === "MATCH" && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`targets.${index}.lowerBound`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lower Bound</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Minimum value"
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
                          name={`targets.${index}.upperBound`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Upper Bound</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Maximum value"
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

                    {/* Weight for multi-target optimization */}
                    {fields.length > 1 && objectiveType === "desirability" && (
                      <FormField
                        control={form.control}
                        name={`targets.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Weight: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0.1}
                                max={10}
                                step={0.1}
                                defaultValue={[field.value]}
                                onValueChange={value =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Higher weight gives this target more importance in
                              the optimization
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Add Target Button */}
              {fields.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTarget}
                  className="w-full"
                >
                  <Plus className="mr-2 size-4" />
                  Add Another Target
                </Button>
              )}
            </div>

            {/* Objective Type Selection (only when multiple targets) */}
            {fields.length > 1 && (
              <FormField
                control={form.control}
                name="objectiveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multi-Target Optimization Strategy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select optimization strategy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="desirability">
                          Desirability Function (with weights)
                        </SelectItem>
                        <SelectItem value="pareto">
                          Pareto Optimization
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose how to handle multiple targets in optimization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Advanced Options */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-settings">
                <AccordionTrigger>Advanced Settings</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-2">
                    <p className="text-muted-foreground text-sm">
                      <strong>Desirability Function:</strong> Uses weighted
                      targets to create a single composite score. Control
                      importance with target weights.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      <strong>Pareto Optimization:</strong> Finds solutions
                      where no target can be improved without sacrificing
                      others. Ideal for true multi-objective optimization with
                      trade-offs.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="submit">Apply Targets</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
