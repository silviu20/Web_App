// components/optimization/multi-target-measurement-form.tsx
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ArrowUp, ArrowDown, MoveHorizontal } from "lucide-react"
import { SelectOptimization } from "@/db/schema/optimizations-schema"
import { addMultiTargetMeasurementWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"

// Create a dynamic schema based on optimization targets
const createMeasurementSchema = (optimization: SelectOptimization) => {
  // Basic schema for parameter values
  const parameterFields: Record<string, z.ZodTypeAny> = {}
  optimization.config.parameters.forEach(param => {
    parameterFields[param.name] = z.string().min(1, `${param.name} is required`)
  })

  // Schema for target values
  const targetFields: Record<string, z.ZodTypeAny> = {}
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  targets.forEach(target => {
    targetFields[`target_${target.name}`] = z
      .string()
      .min(1, `${target.name} value is required`)
  })

  // Combine into one schema
  return z.object({
    ...parameterFields,
    ...targetFields
  })
}

interface MultiTargetMeasurementFormProps {
  optimization: SelectOptimization
  onMeasurementAdded: () => void
  defaultParameters?: Record<string, any>
}

export function MultiTargetMeasurementForm({
  optimization,
  onMeasurementAdded,
  defaultParameters
}: MultiTargetMeasurementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create the form schema based on the optimization
  const measurementSchema = createMeasurementSchema(optimization)

  // Initialize the form
  const form = useForm<z.infer<typeof measurementSchema>>({
    resolver: zodResolver(measurementSchema),
    defaultValues: defaultParameters || {}
  })

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof measurementSchema>) => {
    setIsSubmitting(true)

    try {
      // Extract parameter values
      const parameters: Record<string, any> = {}
      const targetValues: Record<string, number> = {}

      // Separate parameter values from target values
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith("target_")) {
          const targetName = key.replace("target_", "")
          targetValues[targetName] = parseFloat(value as string)
        } else {
          // Process parameters based on their type
          const param = optimization.config.parameters.find(p => p.name === key)
          if (param) {
            if (
              param.type === "NumericalContinuous" ||
              param.type === "NumericalDiscrete"
            ) {
              parameters[key] = parseFloat(value as string)
            } else {
              parameters[key] = value
            }
          }
        }
      })

      // Check that all targets have values
      const targets = optimization.targets || [
        {
          name: optimization.primaryTargetName,
          mode: optimization.primaryTargetMode
        }
      ]
      const missingTargets = targets.filter(
        t => targetValues[t.name] === undefined
      )

      if (missingTargets.length > 0) {
        const missingNames = missingTargets.map(t => t.name).join(", ")
        throw new Error(`Missing values for targets: ${missingNames}`)
      }

      // Submit the measurement
      const result = await addMultiTargetMeasurementWorkflowAction(
        optimization.optimizerId,
        parameters,
        targetValues,
        false // manual entry, not recommended by API
      )

      if (result.isSuccess) {
        toast({
          title: "Measurement added",
          description: "Your measurement has been added successfully"
        })

        // Reset the form
        form.reset()

        // Notify parent
        onMeasurementAdded()
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
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get targets for display
  const targets = optimization.targets || [
    {
      name: optimization.primaryTargetName,
      mode: optimization.primaryTargetMode
    }
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Add Measurement</CardTitle>
            <CardDescription>
              Enter parameter values and the corresponding target values
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parameters Section */}
            <div>
              <h3 className="mb-3 text-lg font-medium">Parameters</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {optimization.config.parameters.map(param => (
                  <FormField
                    key={param.name}
                    control={form.control}
                    name={param.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{param.name}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Enter ${param.name} value`}
                            {...field}
                            type={
                              param.type === "NumericalContinuous" ||
                              param.type === "NumericalDiscrete"
                                ? "number"
                                : "text"
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {param.type === "NumericalContinuous" && param.bounds
                            ? `Range: ${param.bounds[0]} to ${param.bounds[1]}`
                            : param.type === "NumericalDiscrete" ||
                                param.type === "CategoricalParameter"
                              ? `Options: ${param.values?.join(", ")}`
                              : ""}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Targets Section */}
            <div>
              <h3 className="mb-3 text-lg font-medium">Target Values</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {targets.map(target => (
                  <FormField
                    key={`target_${target.name}`}
                    control={form.control}
                    name={`target_${target.name}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          {target.name}
                          {target.mode === "MAX" ? (
                            <ArrowUp className="ml-1 size-4 text-green-500" />
                          ) : target.mode === "MIN" ? (
                            <ArrowDown className="ml-1 size-4 text-red-500" />
                          ) : (
                            <MoveHorizontal className="ml-1 size-4 text-blue-500" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Enter ${target.name} value`}
                            type="number"
                            step="any"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {target.mode === "MAX"
                            ? "Higher values are better"
                            : target.mode === "MIN"
                              ? "Lower values are better"
                              : target.bounds
                                ? `Target: between ${target.bounds[0]} and ${target.bounds[1]}`
                                : "Target specific value"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding Measurement...
                </>
              ) : (
                "Add Measurement"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
