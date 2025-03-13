// lib/objective-handler.ts
"use server"

import {
  TargetConfig,
  TargetMode,
  ObjectiveType,
  SingleTargetObjectiveConfig,
  DesirabilityObjectiveConfig,
  ParetoObjectiveConfig
} from "@/types/optimization-types"

/**
 * Creates and validates target configuration
 */
export function createTarget(
  name: string,
  mode: TargetMode,
  bounds?: [number, number]
): TargetConfig {
  // Validate target name
  if (!name || typeof name !== "string") {
    throw new Error("Target name must be a non-empty string")
  }

  // Validate mode
  if (!["MAX", "MIN", "MATCH"].includes(mode)) {
    throw new Error("Target mode must be one of: MAX, MIN, MATCH")
  }

  // Validate bounds if provided
  if (bounds !== undefined) {
    if (
      !Array.isArray(bounds) ||
      bounds.length !== 2 ||
      typeof bounds[0] !== "number" ||
      typeof bounds[1] !== "number"
    ) {
      throw new Error("Target bounds must be a tuple of two numbers [min, max]")
    }

    if (bounds[0] >= bounds[1]) {
      throw new Error("Target bounds must have min < max")
    }
  }

  return { name, mode, bounds }
}

/**
 * Creates a single target objective
 */
export function createSingleTargetObjective(
  target: TargetConfig
): SingleTargetObjectiveConfig {
  return {
    type: "SingleTargetObjective",
    target
  }
}

/**
 * Creates a desirability objective with multiple targets
 */
export function createDesirabilityObjective(
  targets: TargetConfig[],
  weights?: number[],
  aggregation: "arithmetic" | "geometric" = "arithmetic"
): DesirabilityObjectiveConfig {
  // Validate targets
  if (!targets || !Array.isArray(targets) || targets.length < 2) {
    throw new Error("Desirability objective requires at least two targets")
  }

  // Validate weights if provided
  if (weights !== undefined) {
    if (!Array.isArray(weights) || weights.length !== targets.length) {
      throw new Error("Weights array must match the number of targets")
    }

    if (!weights.every(w => typeof w === "number" && w >= 0)) {
      throw new Error("Weights must be non-negative numbers")
    }
  }

  return {
    type: "DesirabilityObjective",
    targets,
    weights: weights || targets.map(() => 1), // Default to equal weights
    aggregation
  }
}

/**
 * Creates a Pareto objective for multi-objective optimization
 */
export function createParetoObjective(
  targets: TargetConfig[],
  referencePoint?: number[]
): ParetoObjectiveConfig {
  // Validate targets
  if (!targets || !Array.isArray(targets) || targets.length < 2) {
    throw new Error("Pareto objective requires at least two targets")
  }

  // Validate reference point if provided
  if (referencePoint !== undefined) {
    if (
      !Array.isArray(referencePoint) ||
      referencePoint.length !== targets.length
    ) {
      throw new Error("Reference point array must match the number of targets")
    }

    if (!referencePoint.every(p => typeof p === "number")) {
      throw new Error("Reference point values must be numbers")
    }
  }

  return {
    type: "ParetoObjective",
    targets,
    referencePoint
  }
}

/**
 * Determines the appropriate objective type based on targets and configuration
 */
export function determineObjectiveConfig(
  targets: TargetConfig[],
  objectiveOptions?: {
    type?: "single" | "desirability" | "pareto"
    weights?: number[]
    aggregation?: "arithmetic" | "geometric"
    referencePoint?: number[]
  }
): ObjectiveType {
  // Default to single target if only one target is provided
  if (
    targets.length === 1 ||
    !objectiveOptions?.type ||
    objectiveOptions.type === "single"
  ) {
    return createSingleTargetObjective(targets[0])
  }

  // Create the appropriate multi-objective configuration
  switch (objectiveOptions.type) {
    case "desirability":
      return createDesirabilityObjective(
        targets,
        objectiveOptions.weights,
        objectiveOptions.aggregation
      )

    case "pareto":
      return createParetoObjective(targets, objectiveOptions.referencePoint)

    default:
      throw new Error(`Unsupported objective type: ${objectiveOptions.type}`)
  }
}

/**
 * Creates a binary target for yes/no outcomes
 */
export function createBinaryTarget(
  name: string,
  mode: "MAX" | "MIN" // For binary targets, we only support MAX/MIN
): TargetConfig {
  return {
    name,
    mode,
    isBinary: true,
    bounds: [0, 1] // Binary targets are always bounded between 0 and 1
  }
}

/**
 * Calculates default hypervolume reference point for Pareto objectives
 */
export function calculateDefaultReferencePoint(
  targets: TargetConfig[],
  measurements: { targetValues: number[] }[]
): number[] {
  // Implementation of a sensible reference point calculation
  // based on the observed data and optimization modes
  return targets.map((target, index) => {
    const values = measurements.map(m => m.targetValues[index])

    // For maximization, use the minimum observed value
    // For minimization, use the maximum observed value
    if (target.mode === "MAX") {
      return Math.min(...values) - 0.1 * Math.abs(Math.min(...values))
    } else {
      return Math.max(...values) + 0.1 * Math.abs(Math.max(...values))
    }
  })
}
