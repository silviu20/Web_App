// lib/parameter-handler.ts
import { Parameter, Constraint } from "@/types/optimization-types"

/**
 * Validates and processes a list of parameters
 */
export function processParameters(parameters: Parameter[]): Parameter[] {
  if (!parameters || parameters.length === 0) {
    throw new Error("At least one parameter is required")
  }

  return parameters.map(param => {
    // Create a copy to avoid modifying the original
    const processedParam = { ...param }

    // Validate parameter type
    if (!processedParam.type) {
      throw new Error(`Parameter ${processedParam.name} must have a type`)
    }

    // Validate parameter name
    if (!processedParam.name) {
      throw new Error("All parameters must have a name")
    }

    // Validate parameter values based on type
    switch (processedParam.type) {
      case "NumericalContinuous":
        if (!processedParam.bounds || processedParam.bounds.length !== 2) {
          throw new Error(
            `Continuous parameter ${processedParam.name} must have bounds [min, max]`
          )
        }
        break

      case "NumericalDiscrete":
      case "CategoricalParameter":
        if (!processedParam.values || processedParam.values.length === 0) {
          throw new Error(
            `Discrete parameter ${processedParam.name} must have values`
          )
        }
        break
    }

    return processedParam
  })
}

/**
 * Creates a search space configuration from parameters and constraints
 */
export function createSearchSpace(
  parameters: Parameter[],
  constraints: Constraint[] = []
): Record<string, any> {
  return {
    parameters,
    constraints: constraints.length > 0 ? constraints : undefined
  }
}

/**
 * Processes and validates constraints
 */
export function processConstraints(constraints: Constraint[]): Constraint[] {
  if (!constraints || constraints.length === 0) {
    return []
  }

  return constraints.map(constraint => {
    // Create a copy to avoid modifying the original
    const processedConstraint = { ...constraint }

    // Validate constraint type
    if (!processedConstraint.type) {
      throw new Error("All constraints must have a type")
    }

    // Validate parameters are provided
    if (
      !processedConstraint.parameters ||
      processedConstraint.parameters.length === 0
    ) {
      throw new Error(
        `Constraint of type ${processedConstraint.type} must reference at least one parameter`
      )
    }

    // Specific validations based on constraint type
    switch (processedConstraint.type) {
      case "LinearConstraint":
        // Add validation for linear constraint
        break

      case "CardinalityConstraint":
        // Add validation for cardinality constraint
        break

      // Add more constraint types as needed
    }

    return processedConstraint
  })
}

/**
 * Validates if parameters and constraints are compatible
 */
export function validateParametersAndConstraints(
  parameters: Parameter[],
  constraints: Constraint[]
): boolean {
  // Create a map of parameter names for quick lookup
  const parameterMap = new Map(parameters.map(p => [p.name, p]))

  // Check that all parameters referenced in constraints exist
  for (const constraint of constraints) {
    if (constraint.parameters) {
      for (const paramName of constraint.parameters) {
        if (!parameterMap.has(paramName)) {
          throw new Error(
            `Constraint references non-existent parameter: ${paramName}`
          )
        }
      }
    }
  }

  return true
}
