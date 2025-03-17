// lib/api/baybe-client.ts
"use server"

import { ActionState } from "@/types"

/**
 * Base URL for the BayBE API
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_BAYBE_API_URL
const API_KEY = process.env.BAYBE_API_KEY

/**
 * Check API health
 */
export async function checkAPIHealthAction(): Promise<ActionState<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      }
    })

    if (!response.ok) {
      return {
        isSuccess: false,
        message: `API returned status: ${response.status}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("API Health check error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Create a new optimization
 */
export async function createOptimizationAction(
  optimizerId: string,
  config: any
): Promise<ActionState<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/optimizers/${optimizerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify(config)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to create optimization: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Create optimization error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Get a suggestion from the optimizer
 */
export async function getSuggestionAction(
  optimizerId: string,
  batchSize: number = 1
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/recommend?batch_size=${batchSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to get suggestion: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Get suggestion error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Add a measurement to the optimizer
 */
export async function addMeasurementAction(
  optimizerId: string,
  parameters: Record<string, any>,
  targetValue: number | Record<string, number>
): Promise<ActionState<any>> {
  try {
    // Prepare the request body based on whether we have a single target or multiple targets
    let body: any

    if (typeof targetValue === "number") {
      // Single target case
      body = {
        parameters,
        target_value: targetValue
      }
    } else {
      // Multi-target case
      body = {
        parameters,
        target_values: targetValue
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/measurements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to add measurement: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Add measurement error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Add multiple measurements to the optimizer
 */
export async function addMultipleMeasurementsAction(
  optimizerId: string,
  measurements: any[]
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/measurements/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({ measurements })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to add measurements: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Add measurements error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Get the current best point from the optimizer
 */
export async function getBestPointAction(
  optimizerId: string
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/best_point`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to get best point: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Get best point error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Get feature importance analysis
 */
export async function getFeatureImportanceAction(
  optimizerId: string
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/feature_importance`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to get feature importance: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Get feature importance error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Get predictions for specific points
 */
export async function getPredictionsAction(
  optimizerId: string,
  points: Record<string, any>[]
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({ points })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to get predictions: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Get predictions error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Export all campaign data
 */
export async function exportCampaignAction(
  optimizerId: string,
  format: "json" | "csv" = "json"
): Promise<ActionState<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/optimizers/${optimizerId}/export?format=${format}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `Failed to export campaign: ${errorText}`
      }
    }

    const data = await response.json()
    return { isSuccess: true, data }
  } catch (error) {
    console.error("Export campaign error:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}
