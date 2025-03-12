// types/optimization-types.ts

// Parameter types
export type NumericalDiscreteParameter = {
  name: string
  type: "NumericalDiscrete"
  values: number[]
  tolerance?: number
}

export type NumericalContinuousParameter = {
  name: string
  type: "NumericalContinuous"
  bounds: [number, number]
}

export type CategoricalParameter = {
  name: string
  type: "CategoricalParameter"
  values: string[]
  encoding?: "OHE" | "LE"
}

export type Parameter =
  | NumericalDiscreteParameter
  | NumericalContinuousParameter
  | CategoricalParameter

// Target configuration
export type TargetConfig = {
  name: string
  mode: "MAX" | "MIN"
  bounds?: {
    lower?: number
    upper?: number
  }
}

// Constraint types
export type ConstraintConfig = {
  type: string
  parameters: string[]
  [key: string]: any
}

// Recommender configuration types
export type RecommenderConfig = {
  type: string
  [key: string]: any
}

export type TwoPhaseRecommenderConfig = {
  type: "TwoPhaseMetaRecommender"
  initial_recommender: {
    type: string
    [key: string]: any
  }
  recommender: {
    type: string
    n_restarts?: number
    n_raw_samples?: number
    [key: string]: any
  }
}

// Complete optimization configuration
export type OptimizationConfig = {
  parameters: Parameter[]
  target_config: TargetConfig
  recommender_config?: RecommenderConfig | TwoPhaseRecommenderConfig
  constraints?: ConstraintConfig[]
}

// Measurement types
export type MeasurementInput = {
  parameters: Record<string, any>
  target_value: number
}
