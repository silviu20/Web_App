// actions/optimization-workflow-actions.ts
"use server"

import { ActionState } from "@/types";
import { auth } from "@clerk/nextjs/server";


import { 
  createOptimization, 
  getSuggestion, 
  addMeasurement as addApiMeasurement,
  getBestPoint
} from "@/actions/optimization-actions";



import { 
  createOptimizationDBAction,
  getOptimizationByOptimizerIdAction,
  createMeasurementAction,
  updateOptimizationAction
} from "./db/optimizations-actions";
import { 
  InsertOptimization,
  SelectOptimization,
  SelectMeasurement 
} from "@/db/schema/optimizations-schema";

/**
 * Creates a new optimization and stores its metadata in the database
 */
export async function createOptimizationWorkflowAction(
  name: string,
  description: string,
  config: {
    parameters: any[];
    target_config: any;
    recommender_config?: any;
    constraints?: any[];
  }
): Promise<ActionState<SelectOptimization>> {
  // Get the current user ID
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to create an optimization"
    };
  }
  
  try {
    // Create the optimization in the API
    const apiResult = await createOptimization(name, config);
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    // Extract the optimizer ID from the API response
    const optimizerId = `${userId}_${name}_${Date.now()}`;
    
    // Create an entry in our database
    const dbOptimization: InsertOptimization = {
      userId,
      name,
      description,
      optimizerId,
      config,
      targetName: config.target_config.name,
      targetMode: config.target_config.mode,
    };
    
    const dbResult = await createOptimizationDBAction(dbOptimization);
    
    if (!dbResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Database Error: ${dbResult.message}`
      };
    }
    
    return {
      isSuccess: true,
      message: "Optimization created successfully",
      data: dbResult.data
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to create optimization workflow"
    };
  }
}

/**
 * Gets the next suggestion and stores it in the database
 */
export async function getSuggestionWorkflowAction(
  optimizationId: string,
  batchSize: number = 1
): Promise<ActionState<any[]>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get suggestions"
    };
  }
  
  try {
    // Get the optimization from our database
    const optResult = await getOptimizationByOptimizerIdAction(optimizationId);
    
    if (!optResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Database Error: ${optResult.message}`
      };
    }
    
    // Get suggestion from the API
    const apiResult = await getSuggestion(optimizationId, batchSize);
    
    if (!apiResult.isSuccess || !apiResult.data) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    return {
      isSuccess: true,
      message: "Got suggestions successfully",
      data: apiResult.data.suggestions
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to get suggestions"
    };
  }
}

/**
 * Adds a measurement to the optimization and stores it in the database
 */
export async function addMeasurementWorkflowAction(
  optimizationId: string,
  parameters: Record<string, any>,
  targetValue: number,
  isRecommended: boolean = true
): Promise<ActionState<SelectMeasurement>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to add measurements"
    };
  }
  
  try {
    // Get the optimization from our database
    const optResult = await getOptimizationByOptimizerIdAction(optimizationId);
    
    if (!optResult.isSuccess || !optResult.data) {
      return {
        isSuccess: false,
        message: `Database Error: ${optResult.message}`
      };
    }
    
    // Add measurement to the API
    const apiResult = await addApiMeasurement(
      optimizationId,
      parameters,
      targetValue
    );
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    // Add measurement to our database
    const measurement = {
      optimizationId: optResult.data.id,
      parameters,
      targetValue: targetValue.toString(),
      isRecommended
    };
    
    const dbResult = await createMeasurementAction(measurement);
    
    if (!dbResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Database Error: ${dbResult.message}`
      };
    }
    
    // Update best value in the optimization if it's better
    try {
      const bestResult = await getBestPoint(optimizationId);
      
      if (bestResult.isSuccess && bestResult.data && bestResult.data.best_value !== undefined) {
        // Update the optimization with the current best values
        await updateOptimizationAction(optResult.data.id, {
          status: "active"  // Ensure it's marked as active
        });
      }
    } catch (error) {
      console.error("Error updating best value:", error);
      // Continue even if this part fails
    }
    
    return {
      isSuccess: true,
      message: "Measurement added successfully",
      data: dbResult.data
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to add measurement"
    };
  }
}

/**
 * Gets the current best point for the optimization
 */
export async function getBestPointWorkflowAction(
  optimizationId: string
): Promise<ActionState<{
  best_parameters?: Record<string, any>;
  best_value?: number;
}>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get the best point"
    };
  }
  
  try {
    // Get the optimization from our database to verify access
    const optResult = await getOptimizationByOptimizerIdAction(optimizationId);
    
    if (!optResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Database Error: ${optResult.message}`
      };
    }
    
    // Get the best point from the API
    const apiResult = await getBestPoint(optimizationId);
    
    if (!apiResult.isSuccess || !apiResult.data) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    // Return the best point
    return {
      isSuccess: true,
      message: "Got best point successfully",
      data: {
        best_parameters: apiResult.data.best_parameters,
        best_value: apiResult.data.best_value
      }
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to get best point"
    };
  }
}