// db/schema/optimizations-schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb
} from "drizzle-orm/pg-core"

// Optimizations table to store optimization metadata
export const optimizationsTable = pgTable("optimizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  optimizerId: text("optimizer_id").notNull(),
  config: jsonb("config").notNull(),
  targetName: text("target_name").notNull(),
  targetMode: text("target_mode").notNull().default("MAX"),
  status: text("status").notNull().default("active"),
  lastModelUpdate: timestamp("last_model_update"),
  // Best values are commented out since they don't exist in your database yet
  // bestValue: text("best_value"),
  // bestParameters: jsonb("best_parameters"),
  recommenderType: text("recommender_type"),
  acquisitionFunction: text("acquisition_function"),
  hasConstraints: boolean("has_constraints").default(false),
  isMultiObjective: boolean("is_multi_objective").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Measurements table to store experiment results
export const measurementsTable = pgTable("measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  parameters: jsonb("parameters").notNull(),
  targetValue: text("target_value").notNull(), // Store as text to preserve precision
  isRecommended: boolean("is_recommended").default(false), // Track if the measurement came from a suggestion or manual input
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Insights table to store computed insights about optimizations
export const insightsTable = pgTable("insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // e.g., "feature_importance", "prediction_surface", etc.
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Export types, including bestValue and bestParameters for type compatibility
// with other parts of the code that might expect them
export interface InsertOptimization
  extends Omit<
    typeof optimizationsTable.$inferInsert,
    "bestValue" | "bestParameters"
  > {
  bestValue?: string
  bestParameters?: any
}

export interface SelectOptimization
  extends Omit<
    typeof optimizationsTable.$inferSelect,
    "bestValue" | "bestParameters"
  > {
  bestValue?: string
  bestParameters?: any
}

export type InsertMeasurement = typeof measurementsTable.$inferInsert
export type SelectMeasurement = typeof measurementsTable.$inferSelect

export type InsertInsight = typeof insightsTable.$inferInsert
export type SelectInsight = typeof insightsTable.$inferSelect
