// db/schema/optimizations-schema.ts
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb
} from "drizzle-orm/pg-core"

// Define status enum for optimizations
export const optimizationStatusEnum = pgEnum("optimization_status", [
  "draft",
  "active",
  "paused",
  "completed",
  "failed"
])

// Define target mode enum
export const targetModeEnum = pgEnum("target_mode", ["MAX", "MIN"])

// Define the optimizations table
export const optimizationsTable = pgTable("optimizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  optimizerId: text("optimizer_id").notNull().unique(),
  status: optimizationStatusEnum("status").default("draft").notNull(),
  config: jsonb("config").notNull(),
  targetName: text("target_name").notNull(),
  targetMode: targetModeEnum("target_mode").notNull(),
  bestValue: text("best_value"),
  bestParameters: jsonb("best_parameters"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Define the measurements table
export const measurementsTable = pgTable("measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  parameters: jsonb("parameters").notNull(),
  targetValue: text("target_value").notNull(),
  isRecommended: boolean("is_recommended").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Types for database operations
export type InsertOptimization = typeof optimizationsTable.$inferInsert
export type SelectOptimization = typeof optimizationsTable.$inferSelect
export type InsertMeasurement = typeof measurementsTable.$inferInsert
export type SelectMeasurement = typeof measurementsTable.$inferSelect
