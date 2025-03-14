// db/db.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import {
  profilesTable,
  optimizationsTable,
  measurementsTable,
  insightsTable
} from "@/db/schema"

// Initialize Postgres client
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const client = postgres(connectionString, { max: 1 })
const schema = {
  profiles: profilesTable,
  optimizations: optimizationsTable,
  measurements: measurementsTable,
  insights: insightsTable
}

// Initialize Drizzle ORM
export const db = drizzle(client, { schema })
