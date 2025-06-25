CREATE TABLE "events_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE "posts_table" CASCADE;--> statement-breakpoint
DROP TABLE "users_table" CASCADE;