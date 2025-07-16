CREATE TABLE "chore_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_name" text NOT NULL,
	"chore_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"kid_id" integer NOT NULL,
	"date" text NOT NULL,
	"chores_completed" boolean DEFAULT false NOT NULL,
	"extra_tasks_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extra_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"kid_id" integer NOT NULL,
	"task_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kids" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#FF6B6B' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"current_list" text DEFAULT 'A' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"kid_id" integer NOT NULL,
	"task_type" text NOT NULL,
	"task_id" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"date" text NOT NULL
);
