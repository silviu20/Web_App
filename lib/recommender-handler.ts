// lib/recommender-handler.ts
/**
 * Creates a recommender configuration
 */
export function createRecommenderConfig(
  searchSpace: Record<string, any>,
  objective: Record<string, any>,
  options: {
    useGPU?: boolean
    customConfig?: Record<string, any>
  } = {}
): Record<string, any> {
  const { useGPU = false, customConfig } = options

  // Default to TwoPhaseMetaRecommender if no custom config provided
  if (!customConfig) {
    // Default initial recommender (FPSRecommender)
    const initialRecommender = {
      type: "FPSRecommender"
    }

    // Default main recommender (BotorchRecommender)
    const mainRecommender = {
      type: "BotorchRecommender",
      // GPU optimizations if available
      ...(useGPU
        ? {
            n_restarts: 20,
            n_raw_samples: 128
          }
        : {})
    }

    return {
      type: "TwoPhaseMetaRecommender",
      initial_recommender: initialRecommender,
      recommender: mainRecommender,
      switch_after: 1,
      remain_switched: true
    }
  }

  // Use the provided custom configuration
  return {
    ...customConfig,
    // Add GPU optimizations if we're using BotorchRecommender and GPU is available
    ...(useGPU && customConfig.type === "BotorchRecommender"
      ? {
          n_restarts: customConfig.n_restarts || 20,
          n_raw_samples: customConfig.n_raw_samples || 128
        }
      : {})
  }
}

/**
 * Creates an acquisition function configuration
 */
export function createAcquisitionFunctionConfig(
  objective: Record<string, any>,
  recommenderConfig: Record<string, any>,
  options: {
    useGPU?: boolean
    customConfig?: Record<string, any>
  } = {}
): Record<string, any> {
  const { useGPU = false, customConfig } = options

  // If custom configuration is provided, use it
  if (customConfig) {
    return customConfig
  }

  // Choose appropriate default based on objective type
  if (objective.type === "ParetoObjective") {
    return {
      type: "qLogNoisyExpectedHypervolumeImprovement"
    }
  }

  // For single target or desirability objectives
  return {
    type: "qLogExpectedImprovement"
  }
}

/**
 * Validates a recommender configuration
 */
export function validateRecommenderConfig(
  config: Record<string, any>,
  objectiveType: string
): boolean {
  // Check for required fields
  if (!config.type) {
    throw new Error("Recommender configuration must have a type")
  }

  // If it's a TwoPhaseMetaRecommender, validate sub-recommenders
  if (config.type === "TwoPhaseMetaRecommender") {
    if (!config.initial_recommender) {
      throw new Error(
        "TwoPhaseMetaRecommender must have an initial_recommender"
      )
    }
    if (!config.recommender) {
      throw new Error("TwoPhaseMetaRecommender must have a main recommender")
    }
  }

  // Validate acquisition function compatibility with objective type if provided
  if (config.acquisition_function) {
    if (
      objectiveType === "ParetoObjective" &&
      config.acquisition_function.type !==
        "qLogNoisyExpectedHypervolumeImprovement"
    ) {
      throw new Error(
        `Acquisition function ${config.acquisition_function.type} is not compatible with Pareto objectives`
      )
    }
  }

  return true
}
