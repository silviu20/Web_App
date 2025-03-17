// db/schema/optimizations-schema.ts

import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  pgEnum
} from "drizzle-orm/pg-core"

// Define a target mode enum for database
export const targetModeEnum = pgEnum("target_mode", ["MAX", "MIN", "MATCH"])

// Target type for multiple targets
export type Target = {
  name: string
  mode: "MAX" | "MIN" | "MATCH"
  weight?: number
  bounds?: [number, number] // For MATCH mode
}

// Define the objective type enum
export const objectiveTypeEnum = pgEnum("objective_type", [
  "single",
  "desirability",
  "pareto"
])

export const optimizationsTable = pgTable("optimizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  optimizerId: text("optimizer_id").notNull(),
  config: jsonb("config").notNull(),

  // Replace single target fields with targets array and objectiveType
  targets: jsonb("targets").$type<Target[]>().notNull(),
  objectiveType: objectiveTypeEnum("objective_type")
    .notNull()
    .default("single"),

  // Keep primary target for display and backward compatibility
  primaryTargetName: text("primary_target_name").notNull(),
  primaryTargetMode: targetModeEnum("primary_target_mode").notNull(),

  status: text("status").notNull().default("active"),
  lastModelUpdate: timestamp("last_model_update"),
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

// Measurement table
export const measurementsTable = pgTable("measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  parameters: jsonb("parameters").notNull(),

  // Update to store multiple target values
  targetValues: jsonb("target_values")
    .$type<Record<string, string>>()
    .notNull(),

  // Keep original target value field for backward compatibility
  targetValue: text("target_value").notNull(),

  isRecommended: boolean("is_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Insights table - no changes needed
export const insightsTable = pgTable("insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertOptimization = typeof optimizationsTable.$inferInsert
export type SelectOptimization = typeof optimizationsTable.$inferSelect
export type InsertMeasurement = typeof measurementsTable.$inferInsert
export type SelectMeasurement = typeof measurementsTable.$inferSelect
export type InsertInsight = typeof insightsTable.$inferInsert
export type SelectInsight = typeof insightsTable.$inferSelect
