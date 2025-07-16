import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Kids table - includes points and current list assignment
export const kids = pgTable("kids", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#FF6B6B"),
  points: integer("points").notNull().default(0), // for 30-point reward system
  current_list: text("current_list").notNull().default("A"), // "A" or "B" chore list
});

// Chore lists - the A and B lists with active state for stable management
export const choreLists = pgTable("chore_lists", {
  id: serial("id").primaryKey(),
  list_name: text("list_name").notNull(), // "A" or "B"
  chore_name: text("chore_name").notNull(),
  active: boolean("active").notNull().default(true), // for stable task management
});

// Extra tasks - now per-kid with active state
export const extraTasks = pgTable("extra_tasks", {
  id: serial("id").primaryKey(),
  kid_id: integer("kid_id").notNull(), // each kid has their own extra tasks
  task_name: text("task_name").notNull(),
  active: boolean("active").notNull().default(true), // for stable task management
});

// Individual task completions - granular tracking of each task completion
export const taskCompletions = pgTable("task_completions", {
  id: serial("id").primaryKey(),
  kid_id: integer("kid_id").notNull(),
  task_type: text("task_type").notNull(), // "chore" or "extra"
  task_id: integer("task_id").notNull(), // references either chore_lists.id or extra_tasks.id
  completed_at: timestamp("completed_at").notNull().defaultNow(),
  date: text("date").notNull(), // YYYY-MM-DD format for daily tracking
});

// Keep daily progress for summary/allowance tracking (optional, computed from taskCompletions)
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  kid_id: integer("kid_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  chores_completed: boolean("chores_completed").notNull().default(false),
  extra_tasks_completed: boolean("extra_tasks_completed")
    .notNull()
    .default(false),
});

// Settings table for app configuration (admin PIN, etc.)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Schema validation
export const insertKidSchema = createInsertSchema(kids).omit({
  id: true,
});

export const insertChoreListSchema = createInsertSchema(choreLists).omit({
  id: true,
});

export const insertExtraTaskSchema = createInsertSchema(extraTasks).omit({
  id: true,
});

export const insertTaskCompletionSchema = createInsertSchema(
  taskCompletions
).omit({
  id: true,
  completed_at: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit(
  {
    id: true,
  }
);

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Type exports
export type Kid = typeof kids.$inferSelect;
export type InsertKid = z.infer<typeof insertKidSchema>;
export type ChoreList = typeof choreLists.$inferSelect;
export type InsertChoreList = z.infer<typeof insertChoreListSchema>;
export type ExtraTask = typeof extraTasks.$inferSelect;
export type InsertExtraTask = z.infer<typeof insertExtraTaskSchema>;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
