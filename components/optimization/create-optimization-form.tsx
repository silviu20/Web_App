// components/optimization/create-optimization-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Trash, Plus, Beaker, Target } from "lucide-react"
import { createOptimizationWorkflowAction } from "@/actions/optimization-workflow-actions"
import { toast } from "@/components/ui/use-toast"
import { OptimizationConfig, Parameter, TargetConfig } from "@/types"

// Schema for the form validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  target: z.object({
    name: z.string().min(1, "Target name is required"),
    mode: z.enum(["MAX", "MIN"])
  }),
  parameters: z
    .array(
      z.object({
        name: z.string().min(1, "Parameter name is required"),
        type: z.enum([
          "NumericalDiscrete",
          "NumericalContinuous",
          "CategoricalParameter"
        ]),
        values: z.string().min(1, "Values are required"),
        encoding: z.enum(["OHE", "LE"]).optional(),
        tolerance: z.string().optional(),
        bounds: z.string().optional()
      })
    )
    .min(1, "At least one parameter is required")
})

type FormValues = z.infer<typeof formSchema>

export function CreateOptimizationForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      target: {
        name: "Target",
        mode: "MAX"
      },
      parameters: [
        {
          name: "",
          type: "NumericalDiscrete",
          values: "",
          encoding: "OHE",
          tolerance: "",
          bounds: ""
        }
      ]
    }
  })

  // Function to add a new parameter to the form
  const addParameter = () => {
    const parameters = form.getValues("parameters")
    form.setValue("parameters", [
      ...parameters,
      {
        name: "",
        type: "NumericalDiscrete",
        values: "",
        encoding: "OHE",
        tolerance: "",
        bounds: ""
      }
    ])
  }

  // Function to remove a parameter from the form
  const removeParameter = (index: number) => {
    const parameters = form.getValues("parameters")
    if (parameters.length > 1) {
      parameters.splice(index, 1)
      form.setValue("parameters", [...parameters])
    } else {
      toast({
        title: "Cannot remove parameter",
        description: "At least one parameter is required",
        variant: "destructive"
      })
    }
  }

  // Parse values from the form data
  const parseValues = (
    valuesStr: string,
    type: string
  ): number[] | string[] => {
    if (type === "NumericalDiscrete" || type === "NumericalContinuous") {
      return valuesStr.split(",").map(v => Number(v.trim()))
    }
    return valuesStr.split(",").map(v => v.trim())
  }

  // Parse bounds from the form data
  const parseBounds = (boundsStr: string): [number, number] => {
    const parts = boundsStr.split(",").map(v => Number(v.trim()))
    return [parts[0] || 0, parts[1] || 100]
  }

  // Function to convert form values to the API format
  const prepareOptimizationConfig = (data: FormValues): OptimizationConfig => {
    const parameters: Parameter[] = data.parameters.map(param => {
      const base = {
        name: param.name,
        type: param.type
      } as Parameter

      if (param.type === "NumericalDiscrete") {
        return {
          ...base,
          type: "NumericalDiscrete" as const,
          values: parseValues(param.values, param.type) as number[],
          tolerance: param.tolerance ? parseFloat(param.tolerance) : undefined
        }
      } else if (param.type === "NumericalContinuous") {
        return {
          ...base,
          type: "NumericalContinuous" as const,
          bounds: parseBounds(param.bounds || "0,100")
        }
      } else if (param.type === "CategoricalParameter") {
        return {
          ...base,
          type: "CategoricalParameter" as const,
          values: parseValues(param.values, param.type) as string[],
          encoding: param.encoding || "OHE"
        }
      }

      return base
    })

    const target_config: TargetConfig = {
      name: data.target.name,
      mode: data.target.mode
    }

    return {
      parameters,
      target_config,
      recommender_config: {
        type: "TwoPhaseMetaRecommender",
        initial_recommender: {
          type: "FPSRecommender"
        },
        recommender: {
          type: "BotorchRecommender",
          n_restarts: 10,
          n_raw_samples: 64
        }
      }
    }
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const config = prepareOptimizationConfig(data)

      const result = await createOptimizationWorkflowAction(
        data.name,
        data.description || "",
        config
      )

      if (result.isSuccess) {
        toast({
          title: "Optimization created",
          description: "Your optimization has been created successfully"
        })
        router.push(`/dashboard/optimizations/${result.data.id}`)
      } else {
        toast({
          title: "Error creating optimization",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating optimization:", error)
      toast({
        title: "Error creating optimization",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Optimization</CardTitle>
            <CardDescription>
              Configure your optimization parameters and target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optimization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Optimization" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique name for your optimization
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
                        placeholder="A brief description of this optimization"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target Configuration */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-medium">
                <Target className="mr-2 size-5" /> Target Configuration
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="target.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Yield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target.mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MAX">Maximize</SelectItem>
                          <SelectItem value="MIN">Minimize</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Whether to maximize or minimize the target value
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Parameters Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center text-lg font-medium">
                  <Beaker className="mr-2 size-5" /> Parameters
                </h3>
                <Button type="button" variant="outline" onClick={addParameter}>
                  <Plus className="mr-2 size-4" /> Add Parameter
                </Button>
              </div>

              {/* Parameter List */}
              {form.watch("parameters").map((parameter, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Parameter {index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(index)}
                      >
                        <Trash className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NumericalDiscrete">
                                  Numerical Discrete
                                </SelectItem>
                                <SelectItem value="NumericalContinuous">
                                  Numerical Continuous
                                </SelectItem>
                                <SelectItem value="CategoricalParameter">
                                  Categorical
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Type-specific fields */}
                    {form.watch(`parameters.${index}.type`) ===
                      "NumericalDiscrete" && (
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.values`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Values (comma-separated)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="10, 20, 30, 40, 50"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Discrete values to explore
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
                              <FormLabel>Tolerance (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="0.5" {...field} />
                              </FormControl>
                              <FormDescription>
                                Allowed deviation from discrete values
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {form.watch(`parameters.${index}.type`) ===
                      "NumericalContinuous" && (
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.bounds`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bounds (min, max)</FormLabel>
                              <FormControl>
                                <Input placeholder="0, 100" {...field} />
                              </FormControl>
                              <FormDescription>
                                Range of values to explore, e.g., "0, 100"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {form.watch(`parameters.${index}.type`) ===
                      "CategoricalParameter" && (
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.values`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Values (comma-separated)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Red, Green, Blue"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Categorical values to explore
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
                                  <SelectItem value="LE">
                                    Label Encoding (LE)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Optimization"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
