"use server"

// actions/db/optimizations-actions.ts
import { db } from "@/db/db";
import { 
  optimizationsTable, 
  measurementsTable,
  InsertOptimization,
  SelectOptimization,
  InsertMeasurement,
  SelectMeasurement,
  insightsTable,
  InsertInsight
} from "@/db/schema/optimizations-schema";
import { ActionState } from "@/types";
import { eq, desc } from "drizzle-orm";

// Create a new optimization
export async function createOptimizationDBAction(
  optimization: InsertOptimization
): Promise<ActionState<SelectOptimization>> {
  try {
    // Remove potentially problematic fields that might not exist in the database
    const safeOptimization = { ...optimization };
    delete safeOptimization.bestValue;
    delete safeOptimization.bestParameters;
    
    const [newOptimization] = await db.insert(optimizationsTable)
      .values(safeOptimization)
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
    // Use a more explicit query that only selects columns we know exist
    const optimizations = await db.select({
      id: optimizationsTable.id,
      userId: optimizationsTable.userId,
      name: optimizationsTable.name,
      description: optimizationsTable.description,
      optimizerId: optimizationsTable.optimizerId,
      config: optimizationsTable.config,
      targetName: optimizationsTable.targetName,
      targetMode: optimizationsTable.targetMode,
      status: optimizationsTable.status,
      lastModelUpdate: optimizationsTable.lastModelUpdate,
      recommenderType: optimizationsTable.recommenderType,
      acquisitionFunction: optimizationsTable.acquisitionFunction,
      hasConstraints: optimizationsTable.hasConstraints,
      isMultiObjective: optimizationsTable.isMultiObjective,
      createdAt: optimizationsTable.createdAt,
      updatedAt: optimizationsTable.updatedAt
    })
    .from(optimizationsTable)
    .where(eq(optimizationsTable.userId, userId))
    .orderBy(desc(optimizationsTable.createdAt));
    
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
    const optimization = await db.select({
      id: optimizationsTable.id,
      userId: optimizationsTable.userId,
      name: optimizationsTable.name,
      description: optimizationsTable.description,
      optimizerId: optimizationsTable.optimizerId,
      config: optimizationsTable.config,
      targetName: optimizationsTable.targetName,
      targetMode: optimizationsTable.targetMode,
      status: optimizationsTable.status,
      lastModelUpdate: optimizationsTable.lastModelUpdate,
      recommenderType: optimizationsTable.recommenderType,
      acquisitionFunction: optimizationsTable.acquisitionFunction,
      hasConstraints: optimizationsTable.hasConstraints,
      isMultiObjective: optimizationsTable.isMultiObjective,
      createdAt: optimizationsTable.createdAt,
      updatedAt: optimizationsTable.updatedAt
    })
    .from(optimizationsTable)
    .where(eq(optimizationsTable.id, id))
    .then(rows => rows[0]);
    
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
    const optimization = await db.select({
      id: optimizationsTable.id,
      userId: optimizationsTable.userId,
      name: optimizationsTable.name,
      description: optimizationsTable.description,
      optimizerId: optimizationsTable.optimizerId,
      config: optimizationsTable.config,
      targetName: optimizationsTable.targetName,
      targetMode: optimizationsTable.targetMode,
      status: optimizationsTable.status,
      lastModelUpdate: optimizationsTable.lastModelUpdate,
      recommenderType: optimizationsTable.recommenderType,
      acquisitionFunction: optimizationsTable.acquisitionFunction,
      hasConstraints: optimizationsTable.hasConstraints,
      isMultiObjective: optimizationsTable.isMultiObjective,
      createdAt: optimizationsTable.createdAt,
      updatedAt: optimizationsTable.updatedAt
    })
    .from(optimizationsTable)
    .where(eq(optimizationsTable.optimizerId, optimizerId))
    .then(rows => rows[0]);
    
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
    // Remove potentially problematic fields that might not exist in the database
    const safeData = { ...data };
    delete safeData.bestValue;
    delete safeData.bestParameters;
    
    const [updatedOptimization] = await db.update(optimizationsTable)
      .set(safeData)
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

// Create a new insight
export async function createInsightAction(
  insight: InsertInsight
): Promise<ActionState<InsertInsight>> {
  try {
    const [newInsight] = await db.insert(insightsTable)
      .values(insight)
      .returning();
    
    return {
      isSuccess: true,
      message: "Insight created successfully",
      data: newInsight
    };
  } catch (error) {
    console.error("Error creating insight:", error);
    return {
      isSuccess: false,
      message: "Failed to create insight"
    };
  }
}

// Get insights for an optimization
export async function getInsightsAction(
  optimizationId: string,
  type?: string
): Promise<ActionState<any[]>> {
  try {
    let query = db.select().from(insightsTable)
      .where(eq(insightsTable.optimizationId, optimizationId));
      
    if (type) {
      query = query.where(eq(insightsTable.type, type));
    }
    
    const insights = await query;
    
    return {
      isSuccess: true,
      message: "Insights retrieved successfully",
      data: insights
    };
  } catch (error) {
    console.error("Error getting insights:", error);
    return {
      isSuccess: false,
      message: "Failed to get insights"
    };
  }
}
export async function checkAPIHealth() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BAYBE_API_URL;
    if (!apiUrl) {
      console.error("API URL not configured");
      return { 
        isSuccess: false, 
        message: "API URL not configured" 
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BAYBE_API_KEY}`,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { 
        isSuccess: false, 
        message: `API returned status: ${response.status}` 
      };
    }
    
    const data = await response.json();
    return { isSuccess: true, data };
  } catch (error) {
    const message = error instanceof Error 
      ? (error.name === 'AbortError' 
          ? 'API request timed out' 
          : error.message)
      : 'Unknown error occurred';
      
    console.error("API Health check error:", message);
    return { isSuccess: false, message };
  }
}