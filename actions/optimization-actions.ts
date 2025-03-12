// actions/optimization-actions.ts
"use server"

import { ActionState } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { 
  checkAPIHealthAction,
  createOptimizationAction,
  getSuggestionAction,
  addMeasurementAction,
  addMultipleMeasurementsAction,
  getBestPointAction,
  loadOptimizationAction 
} from "@/lib/api/baybe-client";

/**
 * Checks the health status of the BayBE API
 */
export async function checkAPIHealth(): Promise<
  ActionState<{ status: string; using_gpu: boolean; gpu_info?: any }>
> {
  return checkAPIHealthAction();
}

/**
 * Creates a new optimization with the given configuration
 */
export async function createOptimization(
  optimizerName: string,
  config: {
    parameters: any[];
    target_config: any;
    recommender_config?: any;
    constraints?: any[];
  }
): Promise<ActionState<{ status: string; message: string; constraint_count?: number }>> {
  // Get the current user ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to create an optimization"
    };
  }

  // Create a unique optimizer ID that includes the user ID to prevent collisions
  const optimizerId = `${userId}_${optimizerName}_${Date.now()}`;
  
  return createOptimizationAction(optimizerId, config);
}

/**
 * Gets the next suggestion for experimentation
 */
export async function getSuggestion(
  optimizerId: string,
  batchSize: number = 1
): Promise<ActionState<{ status: string; suggestions: any[] }>> {
  // Get the current user ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get suggestions"
    };
  }
  
  return getSuggestionAction(optimizerId, batchSize);
}

/**
 * Adds a measurement to the optimization
 */
export async function addMeasurement(
  optimizerId: string,
  parameters: Record<string, any>,
  targetValue: number
): Promise<ActionState<{ status: string; message: string }>> {
  // Get the current user ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to add measurements"
    };
  }
  
  return addMeasurementAction(optimizerId, parameters, targetValue);
}

/**
 * Adds multiple measurements to the optimization
 */
export async function addMultipleMeasurements(
  optimizerId: string,
  measurements: { parameters: Record<string, any>; target_value: number }[]
): Promise<ActionState<{ status: string; message: string }>> {
  // Get the current user ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to add measurements"
    };
  }
  
  return addMultipleMeasurementsAction(optimizerId, measurements);
}

/**
 * Gets the current best point for the optimization
 */
export async function getBestPoint(
  optimizerId: string
): Promise<
  ActionState<{
    status: string;
    best_parameters?: Record<string, any>;
    best_value?: number;
    message?: string;
  }>
> {
  // Get the current user ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get the best point"
    };
  }
  
  return getBestPointAction(optimizerId);
}

/**
 * Loads an existing optimization
 */
export async function loadOptimization(
  optimizerId: string
): Promise<ActionState<{ status: string; message: string }>> {
  // Get the current user ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to load an optimization"
    };
  }
  
  return loadOptimizationAction(optimizerId);
}