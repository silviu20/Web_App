CREATE TYPE "public"."objective_type" AS ENUM('single', 'desirability', 'pareto');--> statement-breakpoint
CREATE TYPE "public"."target_mode" AS ENUM('MAX', 'MIN', 'MATCH');--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optimization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "optimizations" DROP CONSTRAINT "optimizations_optimizer_id_unique";--> statement-breakpoint
ALTER TABLE "measurements" ALTER COLUMN "is_recommended" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "measurements" ALTER COLUMN "is_recommended" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "optimizations" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "measurements" ADD COLUMN "target_values" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "targets" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "objective_type" "objective_type" DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "primary_target_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "primary_target_mode" "target_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "last_model_update" timestamp;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "recommender_type" text;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "acquisition_function" text;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "has_constraints" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "optimizations" ADD COLUMN "is_multi_objective" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_optimization_id_optimizations_id_fk" FOREIGN KEY ("optimization_id") REFERENCES "public"."optimizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimizations" DROP COLUMN "target_name";--> statement-breakpoint
ALTER TABLE "optimizations" DROP COLUMN "target_mode";