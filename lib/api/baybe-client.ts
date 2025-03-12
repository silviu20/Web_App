// lib/api/baybe-client.ts
"use server"

import { ActionState } from "@/types"

// Base URL for the BayBE API - make sure to update with your actual API URL
const API_BASE_URL = process.env.BAYBE_API_URL || "http://localhost:8000/api/v1"

/**
 * Helper function to make API requests with error handling
 */
async function fetchFromAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    // Add default headers if not provided
    if (!options.headers) {
      options.headers = {
        "Content-Type": "application/json"
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    // Parse JSON response
    const data = await response.json()
    return data
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

/**
 * Check the health status of the BayBE API
 */
export async function checkAPIHealthAction(): Promise<
  ActionState<{ status: string; using_gpu: boolean; gpu_info?: any }>
> {
  try {
    const data = await fetchFromAPI("/health")
    return {
      isSuccess: true,
      message: "API health check successful",
      data: {
        status: data.status || "available",
        using_gpu: data.using_gpu || false,
        gpu_info: data.gpu_info
      }
    }
  } catch (error) {
    console.error("Health check failed:", error)
    return {
      isSuccess: false,
      message: `API health check failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Create a new optimization with the given configuration
 */
export async function createOptimizationAction(
  optimizerId: string,
  config: {
    parameters: any[]
    target_config: any
    recommender_config?: any
    constraints?: any[]
  }
): Promise<
  ActionState<{ status: string; message: string; constraint_count?: number }>
> {
  try {
    const data = await fetchFromAPI("/optimizers", {
      method: "POST",
      body: JSON.stringify({
        optimizer_id: optimizerId,
        ...config
      })
    })

    return {
      isSuccess: true,
      message: "Optimization created successfully",
      data: {
        status: "success",
        message: "Optimization created successfully",
        constraint_count: config.constraints?.length || 0
      }
    }
  } catch (error) {
    console.error("Error creating optimization:", error)
    return {
      isSuccess: false,
      message: `Failed to create optimization: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get the next suggestion for experimentation
 */
export async function getSuggestionAction(
  optimizerId: string,
  batchSize: number = 1
): Promise<ActionState<{ status: string; suggestions: any[] }>> {
  try {
    const data = await fetchFromAPI(
      `/optimizers/${optimizerId}/suggest?batch_size=${batchSize}`
    )

    return {
      isSuccess: true,
      message: "Suggestions retrieved successfully",
      data: {
        status: "success",
        suggestions: data.suggestions || []
      }
    }
  } catch (error) {
    console.error("Error getting suggestions:", error)
    return {
      isSuccess: false,
      message: `Failed to get suggestions: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Add a measurement to the optimization
 */
export async function addMeasurementAction(
  optimizerId: string,
  parameters: Record<string, any>,
  targetValue: number
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    await fetchFromAPI(`/optimizers/${optimizerId}/measurements`, {
      method: "POST",
      body: JSON.stringify({
        parameters,
        target_value: targetValue
      })
    })

    return {
      isSuccess: true,
      message: "Measurement added successfully",
      data: {
        status: "success",
        message: "Measurement added successfully"
      }
    }
  } catch (error) {
    console.error("Error adding measurement:", error)
    return {
      isSuccess: false,
      message: `Failed to add measurement: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Add multiple measurements to the optimization
 */
export async function addMultipleMeasurementsAction(
  optimizerId: string,
  measurements: { parameters: Record<string, any>; target_value: number }[]
): Promise<ActionState<{ status: string; message: string }>> {
  try {
    await fetchFromAPI(`/optimizers/${optimizerId}/measurements/batch`, {
      method: "POST",
      body: JSON.stringify({
        measurements
      })
    })

    return {
      isSuccess: true,
      message: "Measurements added successfully",
      data: {
        status: "success",
        message: "Measurements added successfully"
      }
    }
  } catch (error) {
    console.error("Error adding measurements:", error)
    return {
      isSuccess: false,
      message: `Failed to add measurements: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Get the current best point for the optimization
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
    const data = await fetchFromAPI(`/optimizers/${optimizerId}/best_point`)

    if (!data.best_parameters || data.best_value === undefined) {
      return {
        isSuccess: true,
        message: "No best point available yet",
        data: {
          status: "success",
          message: "No best point available yet"
        }
      }
    }

    return {
      isSuccess: true,
      message: "Best point retrieved successfully",
      data: {
        status: "success",
        best_parameters: data.best_parameters,
        best_value: data.best_value
      }
    }
  } catch (error) {
    console.error("Error getting best point:", error)
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
    await fetchFromAPI(`/optimizers/${optimizerId}/load`, {
      method: "POST"
    })

    return {
      isSuccess: true,
      message: "Optimization loaded successfully",
      data: {
        status: "success",
        message: "Optimization loaded successfully"
      }
    }
  } catch (error) {
    console.error("Error loading optimization:", error)
    return {
      isSuccess: false,
      message: `Failed to load optimization: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
