// db/db.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import {
  profilesTable,
  optimizationsTable,
  measurementsTable
} from "@/db/schema"

// Check for required environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Create database connection
const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString, { max: 1 })

// Define schema for tables
const schema = {
  profiles: profilesTable,
  optimizations: optimizationsTable,
  measurements: measurementsTable
}

// Create drizzle instance with schema
export const db = drizzle(client, { schema })
