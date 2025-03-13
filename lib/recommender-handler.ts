// lib/recommender-handler.ts
"use server"

import {
  RecommenderConfig,
  AcquisitionFunctionConfig,
  SearchSpaceConfig,
  ObjectiveType
} from "@/types/optimization-types"

/**
 * Creates an optimal recommender configuration based on the search space,
 * objective, and available hardware
 */
export function createRecommenderConfig(
  searchSpace: SearchSpaceConfig,
  objective: ObjectiveType,
  options: {
    useGPU?: boolean
    customConfig?: Partial<RecommenderConfig>
    measurementCount?: number
  } = {}
): RecommenderConfig {
  const { useGPU = false, customConfig = {}, measurementCount = 0 } = options

  // If a custom config is provided, merge it with defaults
  if (Object.keys(customConfig).length > 0) {
    return {
      ...getDefaultRecommenderConfig(useGPU),
      ...customConfig
    }
  }

  // For new optimizations with no data, use a TwoPhaseMetaRecommender
  if (measurementCount === 0) {
    return createTwoPhaseMetaRecommender(searchSpace, objective, useGPU)
  }

  // For hybrid search spaces (mix of discrete and continuous)
  if (hasHybridSearchSpace(searchSpace)) {
    return createHybridSpaceRecommender(searchSpace, objective, useGPU)
  }

  // For multi-objective optimization
  if (objective.type === "ParetoObjective") {
    return createParetoRecommender(searchSpace, objective, useGPU)
  }

  // Default to a standard BotorchRecommender
  return createBotorchRecommender(searchSpace, objective, useGPU)
}

/**
 * Creates an appropriate acquisition function configuration based on
 * the objective and recommender
 */
export function createAcquisitionFunctionConfig(
  objective: ObjectiveType,
  recommender: RecommenderConfig,
  options: {
    useGPU?: boolean
    customConfig?: Partial<AcquisitionFunctionConfig>
    noisy?: boolean
  } = {}
): AcquisitionFunctionConfig {
  const { useGPU = false, customConfig = {}, noisy = true } = options

  // If a custom config is provided, merge it with defaults
  if (Object.keys(customConfig).length > 0) {
    return {
      ...getDefaultAcquisitionFunction(objective, noisy, useGPU),
      ...customConfig
    }
  }

  // For Pareto optimization
  if (objective.type === "ParetoObjective") {
    return createHypervolumeAcquisitionFunction(objective, useGPU)
  }

  // For noisy observations
  if (noisy) {
    return createNoisyAcquisitionFunction(objective, useGPU)
  }

  // Default acquisition function
  return createDefaultAcquisitionFunction(objective, useGPU)
}

// Helper functions for creating specific recommender configurations

function getDefaultRecommenderConfig(useGPU: boolean): RecommenderConfig {
  return {
    type: "TwoPhaseMetaRecommender",
    initial_recommender: {
      type: "FPSRecommender"
    },
    recommender: {
      type: "BotorchRecommender",
      n_restarts: useGPU ? 20 : 10,
      n_raw_samples: useGPU ? 128 : 64
    },
    remain_switched: true,
    switch_after_n_points: 0 // Switch as soon as any data is available
  }
}

function createTwoPhaseMetaRecommender(
  searchSpace: SearchSpaceConfig,
  objective: ObjectiveType,
  useGPU: boolean
): RecommenderConfig {
  // Default configuration
  const config = getDefaultRecommenderConfig(useGPU)

  // Adjust based on search space dimensionality
  if (searchSpace.dimensionality > 10) {
    // For high-dimensional spaces, use more samples
    config.recommender.n_raw_samples = useGPU ? 256 : 128
  }

  return config
}

function createHybridSpaceRecommender(
  searchSpace: SearchSpaceConfig,
  objective: ObjectiveType,
  useGPU: boolean
): RecommenderConfig {
  // For hybrid spaces, adjust the Botorch recommender
  return {
    type: "TwoPhaseMetaRecommender",
    initial_recommender: {
      type: "FPSRecommender"
    },
    recommender: {
      type: "BotorchRecommender",
      n_restarts: useGPU ? 20 : 10,
      n_raw_samples: useGPU ? 128 : 64,
      hybrid_space_handler: "auto" // Let BayBE determine the best approach
    },
    remain_switched: true,
    switch_after_n_points: 0
  }
}

function createParetoRecommender(
  searchSpace: SearchSpaceConfig,
  objective: ObjectiveType,
  useGPU: boolean
): RecommenderConfig {
  // For Pareto optimization
  return {
    type: "TwoPhaseMetaRecommender",
    initial_recommender: {
      type: "FPSRecommender"
    },
    recommender: {
      type: "BotorchRecommender",
      n_restarts: useGPU ? 20 : 10,
      n_raw_samples: useGPU ? 256 : 128,
      surrogate: "MOGP", // Multi-output Gaussian Process
      acquisition_function: "qLogNoisyExpectedHypervolumeImprovement"
    },
    remain_switched: true,
    switch_after_n_points: 0
  }
}

function createBotorchRecommender(
  searchSpace: SearchSpaceConfig,
  objective: ObjectiveType,
  useGPU: boolean
): RecommenderConfig {
  // Standard Botorch recommender for single-objective optimization
  return {
    type: "BotorchRecommender",
    n_restarts: useGPU ? 20 : 10,
    n_raw_samples: useGPU ? 128 : 64,
    acquisition_function: "qLogExpectedImprovement",
    surrogate: "SingleTaskGP"
  }
}

// Helper functions for creating acquisition function configurations

function getDefaultAcquisitionFunction(
  objective: ObjectiveType,
  noisy: boolean,
  useGPU: boolean
): AcquisitionFunctionConfig {
  if (noisy) {
    return {
      type: "qLogNoisyExpectedImprovement",
      num_fantasies: useGPU ? 64 : 32
    }
  } else {
    return {
      type: "qLogExpectedImprovement"
    }
  }
}

function createHypervolumeAcquisitionFunction(
  objective: ObjectiveType,
  useGPU: boolean
): AcquisitionFunctionConfig {
  return {
    type: "qLogNoisyExpectedHypervolumeImprovement",
    num_fantasies: useGPU ? 64 : 32,
    alpha: 0.05
  }
}

function createNoisyAcquisitionFunction(
  objective: ObjectiveType,
  useGPU: boolean
): AcquisitionFunctionConfig {
  return {
    type: "qLogNoisyExpectedImprovement",
    num_fantasies: useGPU ? 64 : 32,
    prune_baseline: true
  }
}

function createDefaultAcquisitionFunction(
  objective: ObjectiveType,
  useGPU: boolean
): AcquisitionFunctionConfig {
  return {
    type: "qLogExpectedImprovement"
  }
}

// Utility functions

function hasHybridSearchSpace(searchSpace: SearchSpaceConfig): boolean {
  // Check if the search space contains both continuous and discrete parameters
  const hasDiscrete = searchSpace.parameters.some(
    p => p.type === "NumericalDiscrete" || p.type === "CategoricalParameter"
  )

  const hasContinuous = searchSpace.parameters.some(
    p => p.type === "NumericalContinuous"
  )

  return hasDiscrete && hasContinuous
}
