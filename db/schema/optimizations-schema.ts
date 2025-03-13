// db/schema/optimizations-schema.ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core"

// Add enums for all possible BayBE parameter and recommender types
export const parameterTypeEnum = pgEnum("parameter_type", [
  "NumericalDiscrete",
  "NumericalContinuous",
  "CategoricalParameter",
  "SubstanceParameter"
])

export const recommenderTypeEnum = pgEnum("recommender_type", [
  "TwoPhaseMetaRecommender",
  "SequentialMetaRecommender",
  "FPSRecommender",
  "RandomRecommender",
  "BotorchRecommender"
])

export const acquisitionFunctionEnum = pgEnum("acquisition_function", [
  "qExpectedImprovement",
  "qLogExpectedImprovement",
  "qNoisyExpectedImprovement",
  "qLogNoisyExpectedHypervolumeImprovement",
  "qPosteriorStandardDeviation",
  "qUpperConfidenceBound"
])

// Enhanced optimization table with advanced features
export const optimizationsTable = pgTable("optimizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  optimizerId: text("optimizer_id").notNull().unique(),
  config: jsonb("config").notNull(),
  targetName: text("target_name").notNull(),
  targetMode: text("target_mode").notNull(),
  status: text("status").notNull().default("draft"),
  // Add this line to your optimizationsTable definition
  recommenderType: text("recommender_type"),

  // New fields for advanced features
  recommenderType: recommenderTypeEnum("recommender_type"),
  acquisitionFunction: acquisitionFunctionEnum("acquisition_function"),
  hasConstraints: boolean("has_constraints").default(false),
  insightEnabled: boolean("insight_enabled").default(false),
  isMultiObjective: boolean("is_multi_objective").default(false),
  lastModelUpdate: timestamp("last_model_update"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Enhanced measurements table with additional metrics
export const measurementsTable = pgTable("measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  parameters: jsonb("parameters").notNull(),
  targetValue: text("target_value").notNull(),
  isRecommended: boolean("is_recommended").notNull().default(true),

  // New fields
  uncertainty: text("uncertainty"),
  isPending: boolean("is_pending").default(false),
  modelScore: text("model_score"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// New table for constraints
export const constraintsTable = pgTable("constraints", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Type definitions
export type InsertOptimization = typeof optimizationsTable.$inferInsert
export type SelectOptimization = typeof optimizationsTable.$inferSelect
export type InsertMeasurement = typeof measurementsTable.$inferInsert
export type SelectMeasurement = typeof measurementsTable.$inferSelect
export type InsertConstraint = typeof constraintsTable.$inferInsert
export type SelectConstraint = typeof constraintsTable.$inferSelect
