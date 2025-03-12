// db/schema/optimizations-schema.ts

import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean
} from "drizzle-orm/pg-core"

// Table for storing optimization metadata
export const optimizationsTable = pgTable("optimizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  optimizerId: text("optimizer_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  config: jsonb("config").notNull(),
  targetName: text("target_name").notNull(),
  targetMode: text("target_mode").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Table for storing measurements within an optimization
export const measurementsTable = pgTable("measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  optimizationId: uuid("optimization_id")
    .references(() => optimizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  parameters: jsonb("parameters").notNull(),
  targetValue: text("target_value").notNull(),
  isRecommended: boolean("is_recommended").default(true),
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
