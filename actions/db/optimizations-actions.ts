// actions/db/optimizations-actions.ts
"use server"

import { db } from "@/db/db";
import { 
  optimizationsTable, 
  measurementsTable,
  InsertOptimization,
  SelectOptimization,
  InsertMeasurement,
  SelectMeasurement
} from "@/db/schema/optimizations-schema";
import { ActionState } from "@/types";
import { eq, desc } from "drizzle-orm";

// Create a new optimization
export async function createOptimizationDBAction(
  optimization: InsertOptimization
): Promise<ActionState<SelectOptimization>> {
  try {
    const [newOptimization] = await db.insert(optimizationsTable)
      .values(optimization)
      .returning();
    
    return {
      isSuccess: true,
      message: "Optimization created successfully",
      data: newOptimization
    };
  } catch (error) {
    console.error("Error creating optimization:", error);
    return {
      isSuccess: false,
      message: "Failed to create optimization"
    };
  }
}

// Get all optimizations for a user
export async function getOptimizationsAction(
  userId: string
): Promise<ActionState<SelectOptimization[]>> {
  try {
    const optimizations = await db.query.optimizations.findMany({
      where: eq(optimizationsTable.userId, userId),
      orderBy: [desc(optimizationsTable.createdAt)]
    });
    
    return {
      isSuccess: true,
      message: "Optimizations retrieved successfully",
      data: optimizations
    };
  } catch (error) {
    console.error("Error getting optimizations:", error);
    return {
      isSuccess: false,
      message: "Failed to get optimizations"
    };
  }
}

// Get a single optimization by ID
export async function getOptimizationByIdAction(
  id: string
): Promise<ActionState<SelectOptimization>> {
  try {
    const optimization = await db.query.optimizations.findFirst({
      where: eq(optimizationsTable.id, id)
    });
    
    if (!optimization) {
      return {
        isSuccess: false,
        message: "Optimization not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Optimization retrieved successfully",
      data: optimization
    };
  } catch (error) {
    console.error("Error getting optimization:", error);
    return {
      isSuccess: false,
      message: "Failed to get optimization"
    };
  }
}

// Get an optimization by its optimizer ID
export async function getOptimizationByOptimizerIdAction(
  optimizerId: string
): Promise<ActionState<SelectOptimization>> {
  try {
    const optimization = await db.query.optimizations.findFirst({
      where: eq(optimizationsTable.optimizerId, optimizerId)
    });
    
    if (!optimization) {
      return {
        isSuccess: false,
        message: "Optimization not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Optimization retrieved successfully",
      data: optimization
    };
  } catch (error) {
    console.error("Error getting optimization:", error);
    return {
      isSuccess: false,
      message: "Failed to get optimization"
    };
  }
}

// Update an optimization
export async function updateOptimizationAction(
  id: string,
  data: Partial<InsertOptimization>
): Promise<ActionState<SelectOptimization>> {
  try {
    const [updatedOptimization] = await db.update(optimizationsTable)
      .set(data)
      .where(eq(optimizationsTable.id, id))
      .returning();
    
    if (!updatedOptimization) {
      return {
        isSuccess: false,
        message: "Optimization not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Optimization updated successfully",
      data: updatedOptimization
    };
  } catch (error) {
    console.error("Error updating optimization:", error);
    return {
      isSuccess: false,
      message: "Failed to update optimization"
    };
  }
}

// Delete an optimization
export async function deleteOptimizationAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(optimizationsTable)
      .where(eq(optimizationsTable.id, id));
    
    return {
      isSuccess: true,
      message: "Optimization deleted successfully",
      data: undefined
    };
  } catch (error) {
    console.error("Error deleting optimization:", error);
    return {
      isSuccess: false,
      message: "Failed to delete optimization"
    };
  }
}

// Create a new measurement
export async function createMeasurementAction(
  measurement: InsertMeasurement
): Promise<ActionState<SelectMeasurement>> {
  try {
    const [newMeasurement] = await db.insert(measurementsTable)
      .values(measurement)
      .returning();
    
    return {
      isSuccess: true,
      message: "Measurement created successfully",
      data: newMeasurement
    };
  } catch (error) {
    console.error("Error creating measurement:", error);
    return {
      isSuccess: false,
      message: "Failed to create measurement"
    };
  }
}

// Get all measurements for an optimization
export async function getMeasurementsAction(
  optimizationId: string
): Promise<ActionState<SelectMeasurement[]>> {
  try {
    const measurements = await db.query.measurements.findMany({
      where: eq(measurementsTable.optimizationId, optimizationId),
      orderBy: [desc(measurementsTable.createdAt)]
    });
    
    return {
      isSuccess: true,
      message: "Measurements retrieved successfully",
      data: measurements
    };
  } catch (error) {
    console.error("Error getting measurements:", error);
    return {
      isSuccess: false,
      message: "Failed to get measurements"
    };
  }
}