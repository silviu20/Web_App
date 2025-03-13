// lib/api/baybe-client.ts
"use server"

import { ActionState } from "@/types"

const API_URL = process.env.BAYBE_API_URL || "http://localhost:8000"

/**
 * Helper function to make API requests with proper error handling
 */
async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

/**
 * Check the API health status
 */
export async function checkAPIHealthAction(): Promise<
  ActionState<{ status: string; using_gpu: boolean; gpu_info?: any }>
> {
  try {
    const data = await fetchWithErrorHandling(`${API_URL}/health`)

    return {
      isSuccess: true,
      message: "API health check successful",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `API health check failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Create a new optimization
 */
export async function createOptimizationAction(
  optimizerId: string,
  config: {
    parameters: any[]
    target_config: any
    recommender_config?: any
    constraints?: any[]
    objective_type?: string
    surrogate_config?: any
    acquisition_config?: any
  }
): Promise<
  ActionState<{
    status: string
    message: string
    optimizer_id?: string
    constraint_count?: number
    parameter_count?: number
  }>
> {
  try {
    // Using the correct endpoint from the API
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }
    )

    return {
      isSuccess: true,
      message: "Optimization created successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to create optimization: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get suggestions for an optimization
 */
export async function getSuggestionAction(
  optimizerId: string,
  batchSize: number = 1
): Promise<
  ActionState<{ status: string; suggestions: any[]; batch_size?: number }>
> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/suggest?batch_size=${batchSize}`
    )

    return {
      isSuccess: true,
      message: "Suggestions retrieved successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to get suggestions: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Add a measurement to an optimization
 */
export async function addMeasurementAction(
  optimizerId: string,
  parameters: Record<string, any>,
  targetValue: number
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/measurement`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameters,
          target_value: targetValue
        })
      }
    )

    return {
      isSuccess: true,
      message: "Measurement added successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to add measurement: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Add multiple measurements to an optimization
 */
export async function addMultipleMeasurementsAction(
  optimizerId: string,
  measurements: { parameters: Record<string, any>; target_value: number }[]
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/measurements`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurements
        })
      }
    )

    return {
      isSuccess: true,
      message: "Measurements added successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to add measurements: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get the best point for an optimization
 */
export async function getBestPointAction(optimizerId: string): Promise<
  ActionState<{
    status: string
    best_parameters?: Record<string, any>
    best_value?: number
    total_measurements?: number
    message?: string
  }>
> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/best`
    )

    return {
      isSuccess: true,
      message: "Best point retrieved successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to get best point: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Load an existing optimization
 */
export async function loadOptimizationAction(
  optimizerId: string
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/load`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
    )

    return {
      isSuccess: true,
      message: "Optimization loaded successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to load optimization: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get measurement history for an optimization
 */
export async function getMeasurementHistoryAction(
  optimizerId: string
): Promise<
  ActionState<{ status: string; measurements: any[]; message?: string }>
> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/history`
    )

    return {
      isSuccess: true,
      message: "Measurement history retrieved successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to get measurement history: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get information about an optimization
 */
export async function getOptimizationInfoAction(
  optimizerId: string
): Promise<ActionState<{ status: string; info: any; message?: string }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/info`
    )

    return {
      isSuccess: true,
      message: "Optimization info retrieved successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to get optimization info: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * List all available optimizations
 */
export async function listOptimizationsAction(): Promise<
  ActionState<{ status: string; optimizers: any[]; message?: string }>
> {
  try {
    const data = await fetchWithErrorHandling(`${API_URL}/optimizations`)

    return {
      isSuccess: true,
      message: "Optimizations list retrieved successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to list optimizations: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Delete an optimization (from memory, not from disk)
 */
export async function deleteOptimizationAction(
  optimizerId: string
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}`,
      {
        method: "DELETE"
      }
    )

    return {
      isSuccess: true,
      message: "Optimization deleted successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to delete optimization: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Generate SHAP insights for an optimization
 */
export async function createShapInsightAction(
  optimizerId: string,
  config: {
    explainer_type?: string
    use_comp_rep?: boolean
    force_recreate?: boolean
  } = {}
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/insights/shap`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }
    )

    return {
      isSuccess: true,
      message: "SHAP insight generated successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to generate SHAP insight: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get parameter importance for an optimization based on SHAP values
 */
export async function getFeatureImportanceAction(
  optimizerId: string,
  config: {
    top_n?: number
  } = {}
): Promise<ActionState<{ status: string; feature_importance: any }>> {
  try {
    const data = await fetchWithErrorHandling(
      `${API_URL}/optimizations/${optimizerId}/insights/feature-importance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }
    )

    return {
      isSuccess: true,
      message: "Feature importance retrieved successfully",
      data
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to get feature importance: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
