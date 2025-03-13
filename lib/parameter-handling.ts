// lib/parameter-handler.ts
"use server"

import {
  ParameterType,
  ConstraintType,
  SearchSpaceConfig
} from "@/types/optimization-types"

/**
 * Validates and processes parameter configurations based on type
 */
export function processParameters(rawParameters: any[]): ParameterType[] {
  return rawParameters.map(param => {
    // Validate required fields
    if (!param.name || !param.type) {
      throw new Error(
        `Parameter missing required fields: ${JSON.stringify(param)}`
      )
    }

    // Process based on parameter type
    switch (param.type) {
      case "NumericalDiscrete":
        return validateNumericalDiscreteParameter(param)
      case "NumericalContinuous":
        return validateNumericalContinuousParameter(param)
      case "CategoricalParameter":
        return validateCategoricalParameter(param)
      case "SubstanceParameter":
        return validateSubstanceParameter(param)
      default:
        throw new Error(`Unsupported parameter type: ${param.type}`)
    }
  })
}

/**
 * Validates and processes constraint configurations
 */
export function processConstraints(rawConstraints: any[]): ConstraintType[] {
  if (
    !rawConstraints ||
    !Array.isArray(rawConstraints) ||
    rawConstraints.length === 0
  ) {
    return []
  }

  return rawConstraints.map(constraint => {
    // Validate required fields
    if (!constraint.type) {
      throw new Error(
        `Constraint missing required type: ${JSON.stringify(constraint)}`
      )
    }

    // Process based on constraint type
    switch (constraint.type) {
      case "LinearConstraint":
        return validateLinearConstraint(constraint)
      case "NonlinearConstraint":
        return validateNonlinearConstraint(constraint)
      case "CardinalityConstraint":
        return validateCardinalityConstraint(constraint)
      case "DiscreteSumConstraint":
        return validateDiscreteSumConstraint(constraint)
      case "DiscreteProductConstraint":
        return validateDiscreteProductConstraint(constraint)
      case "DiscreteExcludeConstraint":
        return validateDiscreteExcludeConstraint(constraint)
      // Add handlers for all constraint types
      default:
        throw new Error(`Unsupported constraint type: ${constraint.type}`)
    }
  })
}

/**
 * Creates a complete search space configuration
 */
export function createSearchSpace(
  parameters: ParameterType[],
  constraints: ConstraintType[] = []
): SearchSpaceConfig {
  // Validate parameter compatibility
  validateParameterCompatibility(parameters)

  // Validate constraint compatibility
  if (constraints.length > 0) {
    validateConstraintCompatibility(parameters, constraints)
  }

  return {
    parameters,
    constraints,
    dimensionality: calculateDimensionality(parameters)
  }
}

// Parameter validation functions
function validateNumericalDiscreteParameter(param: any): ParameterType {
  if (!Array.isArray(param.values) || param.values.length === 0) {
    throw new Error(
      `NumericalDiscreteParameter must have non-empty values array: ${param.name}`
    )
  }

  // Check that values are numbers
  if (!param.values.every((val: any) => typeof val === "number")) {
    throw new Error(
      `NumericalDiscreteParameter values must be numbers: ${param.name}`
    )
  }

  return {
    name: param.name,
    type: "NumericalDiscrete",
    values: param.values,
    tolerance:
      param.tolerance !== undefined ? Number(param.tolerance) : undefined
  }
}

function validateNumericalContinuousParameter(param: any): ParameterType {
  if (
    !param.bounds ||
    !Array.isArray(param.bounds) ||
    param.bounds.length !== 2
  ) {
    throw new Error(
      `NumericalContinuousParameter must have bounds [min, max]: ${param.name}`
    )
  }

  const [min, max] = param.bounds

  // Check that bounds are numbers and min < max
  if (typeof min !== "number" || typeof max !== "number" || min >= max) {
    throw new Error(
      `NumericalContinuousParameter bounds must be numbers with min < max: ${param.name}`
    )
  }

  return {
    name: param.name,
    type: "NumericalContinuous",
    bounds: param.bounds
  }
}

function validateCategoricalParameter(param: any): ParameterType {
  if (!Array.isArray(param.values) || param.values.length === 0) {
    throw new Error(
      `CategoricalParameter must have non-empty values array: ${param.name}`
    )
  }

  // Check for duplicate values
  const valueSet = new Set(param.values)
  if (valueSet.size !== param.values.length) {
    throw new Error(
      `CategoricalParameter contains duplicate values: ${param.name}`
    )
  }

  return {
    name: param.name,
    type: "CategoricalParameter",
    values: param.values,
    encoding: param.encoding || "OHE" // Default to one-hot encoding
  }
}

function validateSubstanceParameter(param: any): ParameterType {
  // Implementation would depend on how substances are specified
  return {
    name: param.name,
    type: "SubstanceParameter",
    // Additional substance-specific properties
    ...param
  }
}

// Constraint validation functions
function validateLinearConstraint(constraint: any): ConstraintType {
  if (!constraint.coefficients || !Array.isArray(constraint.coefficients)) {
    throw new Error("LinearConstraint must have coefficients array")
  }

  if (constraint.bound === undefined || typeof constraint.bound !== "number") {
    throw new Error("LinearConstraint must have a numeric bound")
  }

  return {
    type: "LinearConstraint",
    coefficients: constraint.coefficients,
    bound: constraint.bound
  }
}

// Implement other constraint validation functions
// ...

// Compatibility validation
function validateParameterCompatibility(parameters: ParameterType[]): void {
  // Check for duplicate parameter names
  const paramNames = parameters.map(p => p.name)
  const uniqueNames = new Set(paramNames)

  if (uniqueNames.size !== parameters.length) {
    throw new Error("Parameter names must be unique")
  }

  // Additional compatibility checks as needed
}

function validateConstraintCompatibility(
  parameters: ParameterType[],
  constraints: ConstraintType[]
): void {
  // Implement constraint compatibility validation
  // For example, check that LinearConstraint coefficients match parameter count
  // or that parameters referenced in constraints exist
}

function calculateDimensionality(parameters: ParameterType[]): number {
  // Calculate the total dimensionality of the search space
  return parameters.reduce((dim, param) => {
    switch (param.type) {
      case "NumericalDiscrete":
      case "NumericalContinuous":
        return dim + 1
      case "CategoricalParameter":
        // For one-hot encoding, add n-1 dimensions (where n is the number of categories)
        return param.encoding === "OHE"
          ? dim + (param.values.length - 1)
          : dim + 1 // For label encoding, add just 1 dimension
      case "SubstanceParameter":
        // Depends on how substances are represented
        return dim + 1 // Simplified for this example
      default:
        return dim
    }
  }, 0)
}
