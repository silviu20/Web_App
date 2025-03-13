// components/optimization/optimization-wizard.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Server,
  Sliders,
  Target,
  Filter,
  BarChart,
  Check
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createAdvancedOptimizationWorkflowAction } from "@/actions/advanced-optimization-workflow-actions"
import { Parameter, ParameterType } from "@/types"
import { MultiObjectiveForm } from "./multi-objective-form"
import { ConstraintForm } from "./constraint-form"

// Parameter creation form
import { ParameterForm } from "./parameter-form"

// Advanced recommender configuration form
import { RecommenderConfigForm } from "./recommender-config-form"

// Basic information schema
const basicInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  allowGPU: z.boolean().default(true)
})

// Steps in the wizard
type WizardStep =
  | "basic"
  | "parameters"
  | "objectives"
  | "constraints"
  | "recommender"
  | "review"

export function OptimizationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for storing optimization configuration
  const [basicInfo, setBasicInfo] = useState<z.infer<typeof basicInfoSchema>>({
    name: "",
    description: "",
    allowGPU: true
  })
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [objectiveType, setObjectiveType] = useState<string>("single")
  const [constraints, setConstraints] = useState<any[]>([])
  const [recommenderConfig, setRecommenderConfig] = useState<any>({
    type: "TwoPhaseMetaRecommender",
    acquisitionFunction: "qLogExpectedImprovement"
  })

  // Basic info form
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: basicInfo
  })

  // Navigation handler functions
  const goToNextStep = () => {
    switch (currentStep) {
      case "basic":
        if (basicInfoForm.formState.isValid) {
          // Handle validation and data collection
          const data = basicInfoForm.getValues()
          setBasicInfo(data)
          setCurrentStep("parameters")
        } else {
          // Trigger validation
          basicInfoForm.trigger()
        }
        break
      case "parameters":
        if (parameters.length === 0) {
          toast({
            title: "Parameters Required",
            description: "Please add at least one parameter",
            variant: "destructive"
          })
          return
        }
        setCurrentStep("objectives")
        break
      case "objectives":
        if (targets.length === 0) {
          toast({
            title: "Target Required",
            description: "Please add at least one target",
            variant: "destructive"
          })
          return
        }

        // For multi-objective checks
        if (objectiveType !== "single" && targets.length < 2) {
          toast({
            title: "Multiple Targets Required",
            description: `${objectiveType} optimization requires at least two targets`,
            variant: "destructive"
          })
          return
        }

        setCurrentStep("constraints")
        break
      case "constraints":
        setCurrentStep("recommender")
        break
      case "recommender":
        setCurrentStep("review")
        break
      default:
        // No next step for review page
        break
    }
  }

  const goToPreviousStep = () => {
    switch (currentStep) {
      case "parameters":
        setCurrentStep("basic")
        break
      case "objectives":
        setCurrentStep("parameters")
        break
      case "constraints":
        setCurrentStep("objectives")
        break
      case "recommender":
        setCurrentStep("constraints")
        break
      case "review":
        setCurrentStep("recommender")
        break
      default:
        // No previous step for first page
        break
    }
  }

  // Form handler functions
  const handleAddParameter = (parameter: Parameter) => {
    setParameters([...parameters, parameter])
  }

  const handleRemoveParameter = (index: number) => {
    const newParameters = [...parameters]
    newParameters.splice(index, 1)
    setParameters(newParameters)
  }

  const handleAddTarget = (target: any) => {
    setTargets([...targets, target])
  }

  const handleRemoveTarget = (index: number) => {
    const newTargets = [...targets]
    newTargets.splice(index, 1)
    setTargets(newTargets)
  }

  const handleObjectiveTypeChange = (type: string) => {
    setObjectiveType(type)
  }

  const handleAddConstraint = (constraint: any) => {
    setConstraints([...constraints, constraint])
  }

  const handleRemoveConstraint = (index: number) => {
    const newConstraints = [...constraints]
    newConstraints.splice(index, 1)
    setConstraints(newConstraints)
  }

  const handleRecommenderConfigChange = (config: any) => {
    setRecommenderConfig(config)
  }

  // Final submission handler
  const handleSubmitOptimization = async () => {
    setIsSubmitting(true)

    try {
      // Prepare targets configuration
      const targetsConfig = targets.map(target => ({
        name: target.name,
        mode: target.mode,
        ...(target.bounds ? { bounds: target.bounds } : {}),
        ...(target.weight !== undefined ? { weight: target.weight } : {})
      }))

      // Prepare the API configuration
      const config = {
        parameters,
        targets: targetsConfig,
        objectiveType,
        recommenderType: recommenderConfig.type,
        acquisitionFunction: recommenderConfig.acquisitionFunction,
        constraints: constraints.length > 0 ? constraints : undefined
      }

      // Call the API
      const result = await createAdvancedOptimizationWorkflowAction(
        basicInfo.name,
        basicInfo.description || "",
        config
      )

      if (result.isSuccess && result.data) {
        toast({
          title: "Optimization Created",
          description: "Your optimization has been created successfully"
        })

        // Redirect to the optimization page
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
          error instanceof Error
            ? error.message
            : "Failed to create optimization",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Progress indicator
  const getStepProgress = () => {
    const steps: WizardStep[] = [
      "basic",
      "parameters",
      "objectives",
      "constraints",
      "recommender",
      "review"
    ]
    const currentIndex = steps.indexOf(currentStep)
    return ((currentIndex + 1) / steps.length) * 100
  }

  const progressPercent = getStepProgress()

  // Helper function to get step title and description
  const getStepInfo = () => {
    switch (currentStep) {
      case "basic":
        return {
          title: "Basic Information",
          description: "Provide basic details about your optimization",
          icon: <Server className="size-5" />
        }
      case "parameters":
        return {
          title: "Parameters Configuration",
          description: "Define the parameters to be optimized",
          icon: <Sliders className="size-5" />
        }
      case "objectives":
        return {
          title: "Objectives Configuration",
          description: "Define the targets to be optimized",
          icon: <Target className="size-5" />
        }
      case "constraints":
        return {
          title: "Constraints Configuration",
          description: "Define any constraints on the parameters",
          icon: <Filter className="size-5" />
        }
      case "recommender":
        return {
          title: "Recommender Configuration",
          description: "Configure the optimization strategy",
          icon: <BarChart className="size-5" />
        }
      case "review":
        return {
          title: "Review and Create",
          description: "Review your optimization configuration",
          icon: <Check className="size-5" />
        }
      default:
        return {
          title: "Unknown Step",
          description: "",
          icon: null
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <Card className="shadow-lg">
      {/* Progress bar */}
      <div className="bg-primary/10 relative h-2 w-full overflow-hidden rounded-t-lg">
        <div
          className="bg-primary absolute left-0 top-0 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            {stepInfo.icon}
          </div>
          <div>
            <CardTitle>{stepInfo.title}</CardTitle>
            <CardDescription>{stepInfo.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Information Step */}
        {currentStep === "basic" && (
          <Form {...basicInfoForm}>
            <form className="space-y-6">
              <FormField
                control={basicInfoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optimization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Optimization" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your optimization campaign
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
                        placeholder="A brief description of this optimization"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about the purpose of this optimization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={basicInfoForm.control}
                name="allowGPU"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="size-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable GPU Acceleration</FormLabel>
                      <FormDescription>
                        Use GPU for faster optimization when available
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        {/* Parameters Step */}
        {currentStep === "parameters" && (
          <ParameterForm
            onAddParameter={handleAddParameter}
            onRemoveParameter={handleRemoveParameter}
            existingParameters={parameters}
          />
        )}

        {/* Objectives Step */}
        {currentStep === "objectives" && (
          <MultiObjectiveForm
            onAddTarget={handleAddTarget}
            onRemoveTarget={handleRemoveTarget}
            onObjectiveTypeChange={handleObjectiveTypeChange}
            existingTargets={targets}
            currentObjectiveType={objectiveType}
          />
        )}

        {/* Constraints Step */}
        {currentStep === "constraints" && (
          <ConstraintForm
            parameters={parameters}
            onAddConstraint={handleAddConstraint}
            existingConstraints={constraints}
            onRemoveConstraint={handleRemoveConstraint}
          />
        )}

        {/* Recommender Configuration Step */}
        {currentStep === "recommender" && (
          <RecommenderConfigForm
            onChange={handleRecommenderConfigChange}
            initialConfig={recommenderConfig}
            isMultiObjective={objectiveType === "pareto"}
            hasHybridSpace={parameters.some(
              p => p.type === "CategoricalParameter"
            )}
          />
        )}

        {/* Review Step */}
        {currentStep === "review" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium">Name</dt>
                    <dd className="text-muted-foreground mt-1 text-sm">
                      {basicInfo.name}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium">GPU Acceleration</dt>
                    <dd className="text-muted-foreground mt-1 text-sm">
                      {basicInfo.allowGPU ? "Enabled" : "Disabled"}
                    </dd>
                  </div>
                  {basicInfo.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium">Description</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        {basicInfo.description}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Parameters ({parameters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border-b pb-2 text-left font-medium">
                          Name
                        </th>
                        <th className="border-b pb-2 text-left font-medium">
                          Type
                        </th>
                        <th className="border-b pb-2 text-left font-medium">
                          Range/Values
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parameters.map((param, index) => (
                        <tr key={index}>
                          <td className="border-b py-2">{param.name}</td>
                          <td className="border-b py-2">{param.type}</td>
                          <td className="border-b py-2">
                            {param.type === "NumericalContinuous" &&
                            param.bounds
                              ? `${param.bounds[0]} to ${param.bounds[1]}`
                              : param.type === "NumericalDiscrete" &&
                                  Array.isArray(param.values)
                                ? param.values.join(", ")
                                : param.type === "CategoricalParameter" &&
                                    Array.isArray(param.values)
                                  ? param.values.join(", ")
                                  : "Not specified"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Objectives ({targets.length}) -{" "}
                  {objectiveType === "single"
                    ? "Single Target"
                    : objectiveType === "desirability"
                      ? "Desirability"
                      : "Pareto"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border-b pb-2 text-left font-medium">
                          Name
                        </th>
                        <th className="border-b pb-2 text-left font-medium">
                          Mode
                        </th>
                        {objectiveType === "desirability" && (
                          <th className="border-b pb-2 text-left font-medium">
                            Weight
                          </th>
                        )}
                        <th className="border-b pb-2 text-left font-medium">
                          Bounds
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((target, index) => (
                        <tr key={index}>
                          <td className="border-b py-2">{target.name}</td>
                          <td className="border-b py-2">{target.mode}</td>
                          {objectiveType === "desirability" && (
                            <td className="border-b py-2">
                              {target.weight || 1}
                            </td>
                          )}
                          <td className="border-b py-2">
                            {target.bounds
                              ? `[${target.bounds[0]}, ${target.bounds[1]}]`
                              : "Not specified"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Optimization Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium">Recommender Type</dt>
                    <dd className="text-muted-foreground mt-1 text-sm">
                      {recommenderConfig.type}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium">
                      Acquisition Function
                    </dt>
                    <dd className="text-muted-foreground mt-1 text-sm">
                      {recommenderConfig.acquisitionFunction}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {constraints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Constraints ({constraints.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="border-b pb-2 text-left font-medium">
                            Type
                          </th>
                          <th className="border-b pb-2 text-left font-medium">
                            Parameters
                          </th>
                          <th className="border-b pb-2 text-left font-medium">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {constraints.map((constraint, index) => (
                          <tr key={index}>
                            <td className="border-b py-2">{constraint.type}</td>
                            <td className="border-b py-2">
                              {Array.isArray(constraint.parameters)
                                ? constraint.parameters.join(", ")
                                : "Not specified"}
                            </td>
                            <td className="border-b py-2">
                              {constraint.type === "LinearConstraint"
                                ? `Coefficients: [${constraint.coefficients?.join(", ")}], Bound: ${constraint.bound}`
                                : constraint.type === "CardinalityConstraint"
                                  ? `Min: ${constraint.min}, Max: ${constraint.max}`
                                  : constraint.type ===
                                        "DiscreteSumConstraint" ||
                                      constraint.type ===
                                        "DiscreteProductConstraint"
                                    ? `Relation: ${constraint.relation}, Bound: ${constraint.bound}`
                                    : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === "basic"}
        >
          <ChevronLeft className="mr-2 size-4" />
          Back
        </Button>

        {currentStep === "review" ? (
          <Button onClick={handleSubmitOptimization} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Server className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Create Optimization
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goToNextStep}>
            Next
            <ChevronRight className="ml-2 size-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
