// actions/db/migration-actions.ts
"use server"

import { db } from "@/db/db";
import { optimizationsTable, measurementsTable } from "@/db/schema/optimizations-schema";
import { eq } from "drizzle-orm";
import { ActionState } from "@/types";

/**
 * Migrates existing optimization data to the new multi-target schema
 */
export async function migrateToMultiTargetSchemaAction(): Promise<ActionState<{ migrated: number }>> {
  try {
    // Get all optimizations
    const optimizations = await db.select().from(optimizationsTable);
    let migratedCount = 0;

    for (const optimization of optimizations) {
      // Skip already migrated optimizations
      if (optimization.targets) continue;

      // Create targets array from existing targetName and targetMode
      const targets = [
        {
          name: optimization.targetName,
          mode: optimization.targetMode,
          weight: 1
        }
      ];

      // Update the optimization
      await db.update(optimizationsTable)
        .set({
          targets,
          primaryTargetName: optimization.targetName,
          primaryTargetMode: optimization.targetMode,
          objectiveType: "single",
          isMultiObjective: false
        })
        .where(eq(optimizationsTable.id, optimization.id));

      // Get all measurements for this optimization
      const measurements = await db.select().from(measurementsTable)
        .where(eq(measurementsTable.optimizationId, optimization.id));

      for (const measurement of measurements) {
        // Skip already migrated measurements
        if (measurement.targetValues) continue;

        // Create targetValues object from existing targetValue
        const targetValues = {
          [optimization.targetName]: measurement.targetValue
        };

        // Update the measurement
        await db.update(measurementsTable)
          .set({ targetValues })
          .where(eq(measurementsTable.id, measurement.id));
      }

      migratedCount++;
    }

    return {
      isSuccess: true,
      message: `Successfully migrated ${migratedCount} optimizations to multi-target schema`,
      data: { migrated: migratedCount }
    };
  } catch (error) {
    console.error("Error migrating to multi-target schema:", error);
    return {
      isSuccess: false,
      message: "Failed to migrate to multi-target schema"
    };
  }
}