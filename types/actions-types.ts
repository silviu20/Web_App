// types/actions-types.ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }

// types/optimization-types.ts
export type ParameterType =
  | "NumericalDiscrete"
  | "NumericalContinuous"
  | "CategoricalParameter"
  | "SubstanceParameter"

export type ParameterBase = {
  name: string
}

export type NumericalDiscreteParameter = ParameterBase & {
  type: "NumericalDiscrete"
  values: number[]
  tolerance?: number
}

export type NumericalContinuousParameter = ParameterBase & {
  type: "NumericalContinuous"
  bounds: [number, number]
}

export type CategoricalParameter = ParameterBase & {
  type: "CategoricalParameter"
  values: string[]
  encoding: "OHE" | "LE"
}

export type SubstanceParameter = ParameterBase & {
  type: "SubstanceParameter"
  values: string[]
  descriptors?: string[]
}

export type Parameter =
  | NumericalDiscreteParameter
  | NumericalContinuousParameter
  | CategoricalParameter
  | SubstanceParameter

export type TargetConfig = {
  name: string
  mode: "MAX" | "MIN"
  bounds?: {
    lower?: number
    upper?: number
  }
}

export type RecommenderConfig = {
  type: string
  [key: string]: any
}

export type ConstraintBase = {
  type: string
  [key: string]: any
}

export type OptimizationConfig = {
  parameters: Parameter[]
  target_config: TargetConfig
  recommender_config?: RecommenderConfig
  constraints?: ConstraintBase[]
}

export type Measurement = {
  parameters: Record<string, any>
  target_value: number
  isRecommended?: boolean
  createdAt?: Date
}

export type OptimizationStatus = "active" | "completed" | "error" | "paused"

export type Optimization = {
  id: string
  name: string
  description?: string
  optimizerId: string
  status: OptimizationStatus
  config: OptimizationConfig
  targetName: string
  targetMode: "MAX" | "MIN"
  createdAt: Date
  updatedAt: Date
}

// types/index.ts
export * from "./actions-types"
export * from "./optimization-types"
