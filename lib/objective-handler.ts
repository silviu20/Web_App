// lib/objective-handler.ts
import { Target, TargetMode } from "@/types/optimization-types"

/**
 * Creates a target configuration
 */
export function createTarget(
  name: string,
  mode: TargetMode = "MAX",
  bounds?: [number, number]
): Record<string, any> {
  const targetConfig: Record<string, any> = {
    name,
    mode
  }

  if (bounds) {
    targetConfig.bounds = bounds
  }

  return targetConfig
}

/**
 * Determines the objective configuration based on targets and options
 */
export function determineObjectiveConfig(
  targets: Record<string, any>[],
  options: {
    type?: "single" | "desirability" | "pareto"
    weights?: number[]
  } = {}
): Record<string, any> {
  const { type = "single", weights = [] } = options

  if (targets.length === 0) {
    throw new Error("At least one target is required")
  }

  // Single target objective (simplest case)
  if (type === "single" || (targets.length === 1 && type !== "pareto")) {
    return {
      type: "SingleTargetObjective",
      target: targets[0]
    }
  }

  // Multi-objective (desirability approach)
  if (type === "desirability") {
    // Ensure we have weights for all targets
    const targetWeights =
      weights.length === targets.length ? weights : targets.map(() => 1.0) // Default to equal weights

    return {
      type: "DesirabilityObjective",
      targets,
      weights: targetWeights,
      mean_type: "arithmetic" // Default mean type
    }
  }

  // Pareto optimization
  if (type === "pareto") {
    return {
      type: "ParetoObjective",
      targets
    }
  }

  // Default to single target if no valid type specified
  return {
    type: "SingleTargetObjective",
    target: targets[0]
  }
}

/**
 * Validates if a target configuration is valid
 */
export function validateTarget(target: Target): boolean {
  // Check required fields
  if (!target.name) {
    throw new Error("Target must have a name")
  }

  // Check mode is valid
  if (target.mode && !["MAX", "MIN", "MATCH"].includes(target.mode)) {
    throw new Error("Target mode must be one of: MAX, MIN, MATCH")
  }

  // Check bounds if provided
  if (
    target.bounds &&
    (target.bounds.length !== 2 || target.bounds[0] >= target.bounds[1])
  ) {
    throw new Error("Target bounds must be [min, max] with min < max")
  }

  return true
}
