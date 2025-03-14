// types/optimization-types.ts
export interface Parameter {
  name: string
  type: string
  values?: (number | string)[]
  bounds?: [number, number]
  encoding?: string
  tolerance?: number
  description?: string
}

export type TargetMode = "MAX" | "MIN" | "MATCH"

export interface Target {
  name: string
  mode: TargetMode
  bounds?: [number, number]
  type?: "Numerical" | "Binary"
  weight?: number
}

export interface Condition {
  type: string
  threshold?: number
  parameter?: string
  values?: any[]
}

export interface Constraint {
  type: string
  parameters?: string[]
  conditions?: Condition[]
  condition?: Condition
  weight?: number
  constraint_func?: string
  description?: string
}

export interface SurrogateConfig {
  type: string
  kernel?: Record<string, any>
  normalize_targets?: boolean
}

export interface AcquisitionConfig {
  type: string
  beta?: number
}

export interface RecommenderConfig {
  type: string
  initial_recommender?: Record<string, any>
  recommender?: Record<string, any>
  n_restarts?: number
  n_raw_samples?: number
  switch_after?: number
  remain_switched?: boolean
}

export interface OptimizationConfig {
  parameters: Parameter[]
  target_config: Target | Target[]
  recommender_config?: RecommenderConfig
  constraints?: Constraint[]
  objective_type?: "SingleTarget" | "Desirability" | "Pareto"
  surrogate_config?: SurrogateConfig
  acquisition_config?: AcquisitionConfig
}

export interface Measurement {
  parameters: Record<string, any>
  target_value: number
}

export interface OptimizationStatus {
  status: string
  message: string
  optimizer_id?: string
  parameter_count?: number
  constraint_count?: number
}

export interface Suggestion {
  status: string
  suggestions: Record<string, any>[]
  batch_size: number
}

export interface BestPoint {
  status: string
  best_parameters?: Record<string, any>
  best_value?: number
  total_measurements?: number
}

export interface MeasurementHistory {
  status: string
  measurements: Record<string, any>[]
}

export interface CampaignInfo {
  status: string
  info: {
    parameters: any[]
    target: any
    measurements_count: number
  }
}

export interface OptimizationList {
  status: string
  optimizers: {
    id: string
    file_path: string
  }[]
}

export interface FeatureImportance {
  status: string
  feature_importance: Record<string, number>
}

export interface PredictionResult {
  status: string
  predictions: Record<string, any>[]
}

export interface ExportResult {
  status: string
  data: any
}

// Add the types to index.ts
export * from "./optimization-types"
