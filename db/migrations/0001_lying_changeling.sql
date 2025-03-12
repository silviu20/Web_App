CREATE TYPE "public"."optimization_status" AS ENUM('draft', 'active', 'paused', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."target_mode" AS ENUM('MAX', 'MIN');--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optimization_id" uuid NOT NULL,
	"parameters" jsonb NOT NULL,
	"target_value" text NOT NULL,
	"is_recommended" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"optimizer_id" text NOT NULL,
	"status" "optimization_status" DEFAULT 'draft' NOT NULL,
	"config" jsonb NOT NULL,
	"target_name" text NOT NULL,
	"target_mode" "target_mode" NOT NULL,
	"best_value" text,
	"best_parameters" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "optimizations_optimizer_id_unique" UNIQUE("optimizer_id")
);
--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_optimization_id_optimizations_id_fk" FOREIGN KEY ("optimization_id") REFERENCES "public"."optimizations"("id") ON DELETE cascade ON UPDATE no action;