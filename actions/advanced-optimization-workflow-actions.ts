// actions/advanced-optimization-workflow-actions.ts
"use server"

import { ActionState } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { 
  createOptimizationAction, 
  getSuggestionAction, 
  addMeasurementAction,
  addMultipleMeasurementsAction,
  getBestPointAction,
  getFeatureImportanceAction,
  getPredictionsAction,
  exportCampaignAction
} from "@/lib/api/baybe-client";

import { 
  createOptimizationDBAction,
  getOptimizationByOptimizerIdAction,
  createMeasurementAction,
  updateOptimizationAction,
  createInsightAction
} from "@/actions/db/optimizations-actions";

// Import GPU availability checker
import { checkGPUAvailability } from "@/actions/gpu-availability";

import { 
  createSearchSpace, 
  processParameters, 
  processConstraints 
} from "@/lib/parameter-handler";

import { 
  createTarget,
  determineObjectiveConfig
} from "@/lib/objective-handler";

import { 
  createRecommenderConfig,
  createAcquisitionFunctionConfig 
} from "@/lib/recommender-handler";

import { 
  InsertOptimization,
  SelectOptimization,
  SelectMeasurement,
  InsertInsight
} from "@/db/schema/optimizations-schema";

/**
 * Creates a new optimization with advanced configuration options
 */
export async function createAdvancedOptimizationWorkflowAction(
  name: string,
  description: string,
  config: {
    parameters: any[];
    targets: {
      name: string;
      mode: 'MAX' | 'MIN' | 'MATCH';
      bounds?: [number, number];
      weight?: number;
    }[];
    objectiveType?: 'single' | 'desirability' | 'pareto';
    recommenderType?: string;
    acquisitionFunction?: string;
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
    // Process parameters with validation
    const processedParameters = processParameters(config.parameters);
    
    // Process constraints if provided
    const processedConstraints = config.constraints 
      ? processConstraints(config.constraints) 
      : [];
    
    // Create search space
    const searchSpace = createSearchSpace(processedParameters, processedConstraints);
    
    // Create targets
    const targets = config.targets.map(target => 
      createTarget(target.name, target.mode, target.bounds)
    );
    
    // Determine objective configuration
    const objective = determineObjectiveConfig(targets, {
      type: config.objectiveType,
      weights: config.targets.map(t => t.weight ?? 1)
    });
    
    // Check if GPU is available from the API health check
    const useGPUResult = await checkGPUAvailability();
    const useGPU = useGPUResult.isAvailable;
    
    // Create recommender configuration
    const recommenderConfig = createRecommenderConfig(
      searchSpace,
      objective,
      { 
        useGPU,
        customConfig: config.recommenderType ? { type: config.recommenderType } : undefined
      }
    );
    
    // Create acquisition function configuration
    const acquisitionConfig = createAcquisitionFunctionConfig(
      objective,
      recommenderConfig,
      { 
        useGPU,
        customConfig: config.acquisitionFunction ? { type: config.acquisitionFunction } : undefined
      }
    );
    
    // Create a unique optimizer ID that includes the user ID to prevent collisions
    const optimizerId = `${userId}_${name.replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Create the optimization configuration for the API
    const apiConfig = {
      parameters: processedParameters,
      target_config: objective.type === 'SingleTargetObjective' 
        ? objective.target 
        : { targets: targets, type: objective.type },
      recommender_config: {
        ...recommenderConfig,
        acquisition_function_config: acquisitionConfig
      },
      constraints: processedConstraints.length > 0 ? processedConstraints : undefined
    };

    // Create the optimization in the API
    const apiResult = await createOptimizationAction(optimizerId, apiConfig);
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    // Determine the main target name and mode for display
    const mainTarget = config.targets[0]; // Use the first target as the primary one
    
    // Create an entry in our database
    const dbOptimization: InsertOptimization = {
      userId,
      name,
      description,
      optimizerId,
      config: apiConfig,
      targetName: mainTarget.name,
      targetMode: mainTarget.mode,
      status: "active",
      // Additional fields
      recommenderType: recommenderConfig.type,
      acquisitionFunction: acquisitionConfig.type,
      hasConstraints: processedConstraints.length > 0,
      isMultiObjective: objective.type !== 'SingleTargetObjective'
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
      message: error instanceof Error 
        ? `Failed to create optimization: ${error.message}`
        : "Failed to create optimization workflow due to an unknown error"
    };
  }
}

/**
 * Gets suggestions with advanced options
 */
export async function getAdvancedSuggestionWorkflowAction(
  optimizationId: string,
  options: {
    batchSize?: number;
    allowRecommendingMeasured?: boolean;
    allowRecommendingPending?: boolean;
  } = {}
): Promise<ActionState<any[]>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get suggestions"
    };
  }
  
  const { 
    batchSize = 1, 
    allowRecommendingMeasured = false,
    allowRecommendingPending = false
  } = options;
  
  try {
    // Get the optimization from our database
    const optResult = await getOptimizationByOptimizerIdAction(optimizationId);
    
    if (!optResult.isSuccess || !optResult.data) {
      return {
        isSuccess: false,
        message: `Database Error: ${optResult.message}`
      };
    }
    
    // Verify ownership
    if (optResult.data.userId !== userId) {
      return {
        isSuccess: false,
        message: "You don't have permission to access this optimization"
      };
    }
    
    // Get suggestions from the API with advanced options
    const apiResult = await getSuggestionAction(optimizationId, batchSize);
    
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
 * Adds multiple measurements at once
 */
export async function addMultipleMeasurementsWorkflowAction(
  optimizationId: string,
  measurements: { parameters: Record<string, any>; targetValue: number; isRecommended?: boolean }[]
): Promise<ActionState<{ message: string }>> {
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
    
    // Verify ownership
    if (optResult.data.userId !== userId) {
      return {
        isSuccess: false,
        message: "You don't have permission to access this optimization"
      };
    }
    
    // Format for the API
    const apiMeasurements = measurements.map(m => ({
      parameters: m.parameters,
      target_value: m.targetValue
    }));
    
    // Add measurements to the API
    const apiResult = await addMultipleMeasurementsAction(
      optimizationId,
      apiMeasurements
    );
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    // Add measurements to our database
    for (const measurement of measurements) {
      await createMeasurementAction({
        optimizationId: optResult.data.id,
        parameters: measurement.parameters,
        targetValue: measurement.targetValue.toString(),
        isRecommended: measurement.isRecommended ?? false
      });
    }
    
    // Update the optimization status
    await updateOptimizationAction(optResult.data.id, {
      status: "active",
      lastModelUpdate: new Date()
    });
    
    return {
      isSuccess: true,
      message: "Measurements added successfully",
      data: { message: "Measurements added successfully" }
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to add measurements"
    };
  }
}

/**
 * Gets feature importance insights for the optimization
 */
export async function getFeatureImportanceWorkflowAction(
  optimizationId: string
): Promise<ActionState<any>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get insights"
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
    
    // Verify ownership
    if (optResult.data.userId !== userId) {
      return {
        isSuccess: false,
        message: "You don't have permission to access this optimization"
      };
    }
    
    // Get feature importance from the API
    const apiResult = await getFeatureImportanceAction(optimizationId);
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    // Store the insight in our database for future reference
    const insight: InsertInsight = {
      optimizationId: optResult.data.id,
      type: "feature_importance",
      data: apiResult.data
    };
    
    await createInsightAction(insight);
    
    return {
      isSuccess: true,
      message: "Feature importance retrieved successfully",
      data: apiResult.data
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to get feature importance"
    };
  }
}

/**
 * Gets model predictions for specific parameter values
 */
export async function getPredictionsWorkflowAction(
  optimizationId: string,
  points: Record<string, any>[]
): Promise<ActionState<any>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to get predictions"
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
    
    // Verify ownership
    if (optResult.data.userId !== userId) {
      return {
        isSuccess: false,
        message: "You don't have permission to access this optimization"
      };
    }
    
    // Get predictions from the API
    const apiResult = await getPredictionsAction(optimizationId, points);
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    return {
      isSuccess: true,
      message: "Predictions retrieved successfully",
      data: apiResult.data
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to get predictions"
    };
  }
}

/**
 * Exports all optimization data in JSON or CSV format
 */
export async function exportOptimizationWorkflowAction(
  optimizationId: string,
  format: 'json' | 'csv' = 'json'
): Promise<ActionState<any>> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isSuccess: false,
      message: "You must be signed in to export data"
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
    
    // Verify ownership
    if (optResult.data.userId !== userId) {
      return {
        isSuccess: false,
        message: "You don't have permission to access this optimization"
      };
    }
    
    // Export from the API
    const apiResult = await exportCampaignAction(optimizationId, format);
    
    if (!apiResult.isSuccess) {
      return {
        isSuccess: false,
        message: `API Error: ${apiResult.message}`
      };
    }
    
    return {
      isSuccess: true,
      message: "Optimization exported successfully",
      data: apiResult.data
    };
    
  } catch (error) {
    console.error("Error in workflow:", error);
    return {
      isSuccess: false,
      message: "Failed to export optimization"
    };
  }
}

// Helper to check if GPU is available
async function checkGPUAvailability(): Promise<{ isAvailable: boolean }> {
  try {
    const healthCheck = await checkAPIHealthAction();
    return {
      isAvailable: healthCheck.isSuccess && healthCheck.data.using_gpu
    };
  } catch (error) {
    console.error("Error checking GPU availability:", error);
    return { isAvailable: false };
  }
}