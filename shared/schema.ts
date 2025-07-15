import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const kids = pgTable("kids", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stars: integer("stars").notNull().default(0),
  color: text("color").notNull().default("#FF6B6B"), // coral
});

export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  kidId: integer("kid_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  starValue: integer("star_value").notNull().default(1),
  type: text("type").notNull(), // "daily" or "weekly"
  completed: boolean("completed").notNull().default(false),
  dueDate: text("due_date"), // For weekly chores
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  kidId: integer("kid_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  earned: boolean("earned").notNull().default(false),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  starCost: integer("star_cost").notNull(),
  color: text("color").notNull().default("#FFB347"), // orange
});

export const insertKidSchema = createInsertSchema(kids).omit({
  id: true,
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
});

export type Kid = typeof kids.$inferSelect;
export type InsertKid = z.infer<typeof insertKidSchema>;
export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
