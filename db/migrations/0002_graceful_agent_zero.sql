ALTER TABLE "optimizations" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "optimizations" ALTER COLUMN "target_mode" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "optimizations" DROP COLUMN "best_value";--> statement-breakpoint
ALTER TABLE "optimizations" DROP COLUMN "best_parameters";--> statement-breakpoint
DROP TYPE "public"."optimization_status";--> statement-breakpoint
DROP TYPE "public"."target_mode";