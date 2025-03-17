// components/optimization/create-optimization-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Steps } from "@/components/ui/steps"
import { toast } from "@/components/ui/use-toast"
import { ParameterForm } from "@/components/optimization/parameter-form"
import { MultiTargetForm } from "@/components/optimization/multi-target-form"
import { ConstraintForm } from "@/components/optimization/constraint-form"
import { createAdvancedOptimizationWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { Loader2, CheckCircle, ArrowRight } from "lucide-react"

// Schema for the basic information form
const basicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional()
})

export function CreateOptimizationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data for each step
  const [basicInfo, setBasicInfo] = useState<z.infer<
    typeof basicInfoSchema
  > | null>(null)
  const [parameters, setParameters] = useState<any[]>([])
  const [targetsData, setTargetsData] = useState<{
    targets: any[]
    objectiveType: "single" | "desirability" | "pareto"
  } | null>(null)
  const [constraints, setConstraints] = useState<any[]>([])

  // Basic info form
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  })

  // Handle completion of basic info step
  const onBasicInfoSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    setBasicInfo(data)
    setCurrentStep(1)
  }

  // Handle completion of parameters step
  const onParametersSubmit = (params: any[]) => {
    setParameters(params)
    setCurrentStep(2)
  }

  // Handle completion of targets step
  const onTargetsSubmit = (data: {
    targets: any[]
    objectiveType: "single" | "desirability" | "pareto"
  }) => {
    setTargetsData(data)
    setCurrentStep(3)
  }

  // Handle adding a constraint
  const onAddConstraint = (constraint: any) => {
    setConstraints([...constraints, constraint])
  }

  // Handle removing a constraint
  const onRemoveConstraint = (index: number) => {
    const updated = [...constraints]
    updated.splice(index, 1)
    setConstraints(updated)
  }

  // Handle form submission to create optimization
  const handleCreateOptimization = async () => {
    if (!basicInfo || !parameters.length || !targetsData) {
      toast({
        title: "Missing information",
        description: "Please complete all required steps",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the configuration object for the API
      const config = {
        parameters,
        targets: targetsData.targets,
        objectiveType: targetsData.objectiveType,
        constraints: constraints.length > 0 ? constraints : undefined
      }

      // Call the API to create the optimization
      const result = await createAdvancedOptimizationWorkflowAction(
        basicInfo.name,
        basicInfo.description || "",
        config
      )

      if (result.isSuccess) {
        toast({
          title: "Optimization created",
          description: "Your optimization has been created successfully"
        })

        // Navigate to the optimization page
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
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Steps for the creation process
  const steps = [
    {
      title: "Basic Information",
      description: "Name and describe your optimization"
    },
    {
      title: "Parameters",
      description: "Define the input parameters"
    },
    {
      title: "Targets",
      description: "Specify what to optimize"
    },
    {
      title: "Constraints",
      description: "Add optional constraints"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <Steps currentStep={currentStep} steps={steps} />

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <Form {...basicInfoForm}>
            <form onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Provide a name and description for your optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={basicInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Catalyst Optimization"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for your optimization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicInfoForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the purpose and goals of this optimization"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide context about what you're trying to optimize
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" disabled>
                    Back
                  </Button>
                  <Button type="submit">
                    Next
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        )}

        {/* Step 2: Parameters */}
        {currentStep === 1 && (
          <div>
            <ParameterForm
              parameters={parameters}
              onSubmit={onParametersSubmit}
            />
            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(0)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => onParametersSubmit(parameters)}
                disabled={parameters.length === 0}
              >
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Targets */}
        {currentStep === 2 && (
          <div>
            <MultiTargetForm
              onSubmit={onTargetsSubmit}
              defaultValues={targetsData || undefined}
            />
            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (targetsData && targetsData.targets.length > 0) {
                    setCurrentStep(3)
                  } else {
                    toast({
                      title: "Missing targets",
                      description: "Please define at least one target",
                      variant: "destructive"
                    })
                  }
                }}
                disabled={!targetsData || targetsData.targets.length === 0}
              >
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Constraints */}
        {currentStep === 3 && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Constraints (Optional)</CardTitle>
                <CardDescription>
                  Add constraints to ensure valid parameter combinations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Display current constraints */}
                {constraints.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Current Constraints</h3>
                    {constraints.map((constraint, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="font-medium">{constraint.type}</p>
                          <p className="text-muted-foreground text-sm">
                            {constraint.parameters?.join(", ") ||
                              "No parameters defined"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveConstraint(index)}
                        >
                          <Loader2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraint form */}
                <ConstraintForm
                  parameters={parameters}
                  onAddConstraint={onAddConstraint}
                  existingConstraints={constraints}
                />

                {/* Submit button for creating optimization */}
                <div className="mt-6 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateOptimization}
                    disabled={isSubmitting}
                  >
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
