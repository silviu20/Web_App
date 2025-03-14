// lib/api/baybe-client.ts
"use server"

import { ActionState } from "@/types"

/**
 * Base URL for the BayBE API
 */
const API_BASE_URL = process.env.BAYBE_API_URL || "http://localhost:8000"

/**
 * Handles API responses and errors consistently
 */
async function handleResponse<T>(response: Response): Promise<ActionState<T>> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorMessage
    } catch (e) {
      // Use default error message if can't parse response
    }
    return { isSuccess: false, message: errorMessage }
  }

  try {
    const data = await response.json()
    return { isSuccess: true, message: data.message || "Success", data: data }
  } catch (error) {
    return {
      isSuccess: false,
      message: `Failed to parse API response: ${(error as Error).message}`
    }
  }
}

/**
 * Checks the health status of the BayBE API
 */
export async function checkAPIHealthAction(): Promise<
  ActionState<{ status: string; using_gpu: boolean; gpu_info?: any }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Creates a new optimization with the given configuration
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
  ActionState<{ status: string; message: string; constraint_count?: number }>
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Gets the next suggestions for experimentation
 */
export async function getSuggestionAction(
  optimizerId: string,
  batchSize: number = 1
): Promise<ActionState<{ status: string; suggestions: any[] }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/suggest?batch_size=${batchSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Adds a measurement to the optimization
 */
export async function addMeasurementAction(
  optimizerId: string,
  parameters: Record<string, any>,
  targetValue: number
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/measurement`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          parameters,
          target_value: targetValue
        })
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Adds multiple measurements to the optimization
 */
export async function addMultipleMeasurementsAction(
  optimizerId: string,
  measurements: { parameters: Record<string, any>; target_value: number }[]
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/measurements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          measurements
        })
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Gets the current best point for the optimization
 */
export async function getBestPointAction(optimizerId: string): Promise<
  ActionState<{
    status: string
    best_parameters?: Record<string, any>
    best_value?: number
    message?: string
  }>
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/best`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Loads an existing optimization
 */
export async function loadOptimizationAction(
  optimizerId: string
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/load`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Gets the measurement history for an optimization
 */
export async function getMeasurementHistoryAction(
  optimizerId: string
): Promise<ActionState<{ measurements: any[] }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/history`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Gets information about an optimization campaign
 */
export async function getCampaignInfoAction(
  optimizerId: string
): Promise<ActionState<{ info: any }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}/info`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Lists all available optimizations
 */
export async function listOptimizationsAction(): Promise<
  ActionState<{ optimizers: any[] }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/optimizations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Deletes an optimization from memory (not from disk)
 */
export async function deleteOptimizationAction(
  optimizerId: string
): Promise<ActionState<{ message: string }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizations/${optimizerId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Gets feature importance insights for the optimization
 */
export async function getFeatureImportanceAction(
  optimizerId: string
): Promise<ActionState<Record<string, number>>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/insights/${optimizerId}/feature-importance`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Gets predictions for specific parameter values
 */
export async function getPredictionsAction(
  optimizerId: string,
  points: Record<string, any>[]
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/insights/${optimizerId}/predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ points })
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}

/**
 * Exports all optimization data in the specified format
 */
export async function exportCampaignAction(
  optimizerId: string,
  format: "json" | "csv" = "json"
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/insights/${optimizerId}/export?format=${format}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    return handleResponse(response)
  } catch (error) {
    return {
      isSuccess: false,
      message: `Network error: ${(error as Error).message}`
    }
  }
}
