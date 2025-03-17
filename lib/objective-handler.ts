// lib/objective-handler.ts

/**
 * Creates a target object for the Bayesian Optimization API
 */
export function createTarget(
  name: string,
  mode: "MAX" | "MIN" | "MATCH",
  bounds?: [number, number]
) {
  const target = {
    name,
    mode
  }

  // Add bounds for MATCH mode
  if (mode === "MATCH" && bounds) {
    return {
      ...target,
      bounds
    }
  }

  return target
}

/**
 * Options for determining the objective configuration
 */
interface ObjectiveOptions {
  type?: "single" | "desirability" | "pareto"
  weights?: number[]
}

/**
 * Determines the objective configuration based on targets and options
 */
export function determineObjectiveConfig(
  targets: any[],
  options: ObjectiveOptions = {}
) {
  // Use the provided type or determine based on number of targets
  const objectiveType =
    options.type || (targets.length > 1 ? "desirability" : "single")

  // Create the appropriate objective config
  switch (objectiveType) {
    case "single":
      return {
        type: "SingleTargetObjective",
        target: targets[0]
      }

    case "desirability":
      return {
        type: "DesirabilityObjective",
        targets,
        weights: options.weights || targets.map(() => 1)
      }

    case "pareto":
      return {
        type: "ParetoObjective",
        targets
      }

    default:
      throw new Error(`Unsupported objective type: ${objectiveType}`)
  }
}

/**
 * Convert a target mode string to the appropriate enum value
 */
export function normalizeTargetMode(mode: string): "MAX" | "MIN" | "MATCH" {
  const normalized = mode.toUpperCase()
  if (normalized === "MAX" || normalized === "MIN" || normalized === "MATCH") {
    return normalized as "MAX" | "MIN" | "MATCH"
  }
  throw new Error(`Invalid target mode: ${mode}. Must be MAX, MIN, or MATCH.`)
}
