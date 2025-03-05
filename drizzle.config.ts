/*
Configures Drizzle for the app.
*/

import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Load environment variables from .env.local file
config({ path: ".env.local" })

// Debug: Log the loaded environment variables
console.debug("Loaded environment variables:", {
  DATABASE_URL: process.env.DATABASE_URL,
})

// Define the Drizzle configuration
const drizzleConfig = defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! }
})

// Debug: Log the Drizzle configuration
console.debug("Drizzle configuration:", drizzleConfig)

export default drizzleConfig
