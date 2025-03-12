// lib/api/baybe-client.ts

import { ActionState } from "@/types"

// The base URL of the BayBE API
const API_URL = process.env.NEXT_PUBLIC_BAYBE_API_URL
const API_KEY = process.env.BAYBE_API_KEY

/**
 * Handles errors from fetch API calls
 */
function handleFetchError(error: unknown): string {
  console.error("API call failed:", error)
  if (error instanceof Error) {
    return error.message
  }
  return "An unknown error occurred"
}

/**
 * Base function to make API calls to the BayBE API
 */
async function callBayBeAPI<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  data?: any
): Promise<ActionState<T>> {
  if (!API_URL) {
    return {
      isSuccess: false,
      message: "BAYBE_API_URL is not configured"
    }
  }

  if (!API_KEY) {
    return {
      isSuccess: false,
      message: "BAYBE_API_KEY is not configured"
    }
  }

  const url = `${API_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: data ? JSON.stringify(data) : undefined,
      // Don't cache requests to the BayBE API
      cache: "no-store"
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isSuccess: false,
        message: `API error (${response.status}): ${errorText}`
      }
    }

    const result = await response.json()
    return {
      isSuccess: true,
      message: result.message || "Success",
      data: result as T
    }
  } catch (error) {
    return {
      isSuccess: false,
      message: handleFetchError(error)
    }
  }
}

/**
 * Gets the API health status
 */
export async function checkAPIHealthAction(): Promise<
  ActionState<{ status: string; using_gpu: boolean; gpu_info?: any }>
> {
  return callBayBeAPI<{ status: string; using_gpu: boolean; gpu_info?: any }>(
    "/health"
  )
}

/**
 * Creates a new optimization with the given ID and configuration
 */
export async function createOptimizationAction(
  optimizer_id: string,
  config: {
    parameters: any[]
    target_config: any
    recommender_config?: any
    constraints?: any[]
  }
): Promise<
  ActionState<{ status: string; message: string; constraint_count?: number }>
> {
  return callBayBeAPI<{
    status: string
    message: string
    constraint_count?: number
  }>(`/optimization/${optimizer_id}`, "POST", config)
}

/**
 * Gets the next suggestion(s) for the specified optimization
 */
export async function getSuggestionAction(
  optimizer_id: string,
  batch_size: number = 1
): Promise<ActionState<{ status: string; suggestions: any[] }>> {
  return callBayBeAPI<{ status: string; suggestions: any[] }>(
    `/optimization/${optimizer_id}/suggest?batch_size=${batch_size}`
  )
}

/**
 * Adds a measurement to the specified optimization
 */
export async function addMeasurementAction(
  optimizer_id: string,
  parameters: Record<string, any>,
  target_value: number
): Promise<ActionState<{ status: string; message: string }>> {
  return callBayBeAPI<{ status: string; message: string }>(
    `/optimization/${optimizer_id}/measurement`,
    "POST",
    {
      parameters,
      target_value
    }
  )
}

/**
 * Adds multiple measurements to the specified optimization
 */
export async function addMultipleMeasurementsAction(
  optimizer_id: string,
  measurements: { parameters: Record<string, any>; target_value: number }[]
): Promise<ActionState<{ status: string; message: string }>> {
  return callBayBeAPI<{ status: string; message: string }>(
    `/optimization/${optimizer_id}/measurements`,
    "POST",
    {
      measurements
    }
  )
}

/**
 * Gets the current best point for the specified optimization
 */
export async function getBestPointAction(optimizer_id: string): Promise<
  ActionState<{
    status: string
    best_parameters?: Record<string, any>
    best_value?: number
    message?: string
  }>
> {
  return callBayBeAPI<{
    status: string
    best_parameters?: Record<string, any>
    best_value?: number
    message?: string
  }>(`/optimization/${optimizer_id}/best`)
}

/**
 * Loads an existing optimization
 */
export async function loadOptimizationAction(
  optimizer_id: string
): Promise<ActionState<{ status: string; message: string }>> {
  return callBayBeAPI<{ status: string; message: string }>(
    `/optimization/${optimizer_id}/load`
  )
}
