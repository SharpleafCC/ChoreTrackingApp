import {
  kids,
  choreLists,
  extraTasks,
  taskCompletions,
  dailyProgress,
  settings,
  type Kid,
  type InsertKid,
  type ChoreList,
  type InsertChoreList,
  type ExtraTask,
  type InsertExtraTask,
  type TaskCompletion,
  type InsertTaskCompletion,
  type DailyProgress,
  type InsertDailyProgress,
  type Settings,
  type InsertSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";

export interface IStorage {
  // Kids
  getAllKids(): Promise<Kid[]>;
  getKid(id: number): Promise<Kid | undefined>;
  updateKid(id: number, updates: Partial<Kid>): Promise<Kid | undefined>;
  switchKidLists(): Promise<void>; // Switch A/B lists for all kids
  awardPoints(kidId: number, points: number): Promise<void>;

  // Chore Lists (with active state management)
  getActiveChoreList(listName: string): Promise<ChoreList[]>; // Get active chores for A or B list
  getKidActiveChores(kidId: number): Promise<ChoreList[]>; // Get active chores for kid's current list
  getAllChores(): Promise<ChoreList[]>; // Get all chores (active and inactive)
  updateChore(
    choreId: number,
    updates: Partial<ChoreList>
  ): Promise<ChoreList | undefined>; // Update chore
  deactivateChore(choreId: number): Promise<void>; // Deactivate instead of delete
  addChore(chore: InsertChoreList): Promise<ChoreList>; // Add new chore

  // Extra Tasks (per-kid with active state)
  getKidActiveExtraTasks(kidId: number): Promise<ExtraTask[]>; // Get active extra tasks for specific kid
  getAllExtraTasks(): Promise<ExtraTask[]>; // Get all extra tasks (active and inactive)
  updateExtraTask(
    taskId: number,
    updates: Partial<ExtraTask>
  ): Promise<ExtraTask | undefined>; // Update extra task
  deactivateExtraTask(taskId: number): Promise<void>; // Deactivate instead of delete
  addExtraTask(task: InsertExtraTask): Promise<ExtraTask>; // Add new extra task

  // Individual Task Completions
  markTaskComplete(
    kidId: number,
    taskType: "chore" | "extra",
    taskId: number,
    date: string
  ): Promise<TaskCompletion>;
  unmarkTaskComplete(
    kidId: number,
    taskType: "chore" | "extra",
    taskId: number,
    date: string
  ): Promise<void>;
  getTaskCompletions(kidId: number, date: string): Promise<TaskCompletion[]>;
  isTaskCompleted(
    kidId: number,
    taskType: "chore" | "extra",
    taskId: number,
    date: string
  ): Promise<boolean>;
  getTaskHistory(
    kidId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<any[]>; // Get task completion history

  // Daily Progress (computed from individual completions)
  computeDailyProgress(
    kidId: number,
    date: string
  ): Promise<{
    choresCompleted: boolean;
    extraTasksCompleted: boolean;
    pointsEarned: number;
  }>;

  // Settings
  getSetting(key: string): Promise<string | null>; // Get a setting value by key
  setSetting(key: string, value: string): Promise<Settings>; // Set/update a setting value
  initializeDefaultSettings(): Promise<void>; // Initialize default settings if they don't exist
}

class DatabaseStorage implements IStorage {
  // Kids
  async getAllKids(): Promise<Kid[]> {
    return await db.select().from(kids).orderBy(asc(kids.id));
  }

  async getKid(id: number): Promise<Kid | undefined> {
    const result = await db.select().from(kids).where(eq(kids.id, id));
    return result[0];
  }

  async updateKid(id: number, updates: Partial<Kid>): Promise<Kid | undefined> {
    const result = await db
      .update(kids)
      .set(updates)
      .where(eq(kids.id, id))
      .returning();
    return result[0];
  }

  async switchKidLists(): Promise<void> {
    // Switch all kids from A to B or B to A
    const allKids = await this.getAllKids();
    for (const kid of allKids) {
      const newList = kid.current_list === "A" ? "B" : "A";
      await this.updateKid(kid.id, { current_list: newList });
    }
  }

  async awardPoints(kidId: number, points: number): Promise<void> {
    const kid = await this.getKid(kidId);
    if (kid) {
      await db
        .update(kids)
        .set({ points: kid.points + points })
        .where(eq(kids.id, kidId));
    }
  }

  // Chore Lists
  async getActiveChoreList(listName: string): Promise<ChoreList[]> {
    return await db
      .select()
      .from(choreLists)
      .where(
        and(eq(choreLists.list_name, listName), eq(choreLists.active, true))
      );
  }

  async getKidActiveChores(kidId: number): Promise<ChoreList[]> {
    const kid = await this.getKid(kidId);
    if (!kid) return [];
    return await this.getActiveChoreList(kid.current_list);
  }

  async deactivateChore(choreId: number): Promise<void> {
    await db
      .update(choreLists)
      .set({ active: false })
      .where(eq(choreLists.id, choreId));
  }

  async getAllChores(): Promise<ChoreList[]> {
    return await db.select().from(choreLists).orderBy(asc(choreLists.id));
  }

  async updateChore(
    choreId: number,
    updates: Partial<ChoreList>
  ): Promise<ChoreList | undefined> {
    const result = await db
      .update(choreLists)
      .set(updates)
      .where(eq(choreLists.id, choreId))
      .returning();
    return result[0];
  }

  async addChore(chore: InsertChoreList): Promise<ChoreList> {
    const result = await db.insert(choreLists).values(chore).returning();
    return result[0];
  }

  // Extra Tasks
  async getKidActiveExtraTasks(kidId: number): Promise<ExtraTask[]> {
    return await db
      .select()
      .from(extraTasks)
      .where(and(eq(extraTasks.kid_id, kidId), eq(extraTasks.active, true)));
  }

  async deactivateExtraTask(taskId: number): Promise<void> {
    await db
      .update(extraTasks)
      .set({ active: false })
      .where(eq(extraTasks.id, taskId));
  }

  async getAllExtraTasks(): Promise<ExtraTask[]> {
    return await db.select().from(extraTasks).orderBy(asc(extraTasks.id));
  }

  async updateExtraTask(
    taskId: number,
    updates: Partial<ExtraTask>
  ): Promise<ExtraTask | undefined> {
    const result = await db
      .update(extraTasks)
      .set(updates)
      .where(eq(extraTasks.id, taskId))
      .returning();
    return result[0];
  }

  async addExtraTask(task: InsertExtraTask): Promise<ExtraTask> {
    const result = await db.insert(extraTasks).values(task).returning();
    return result[0];
  }

  // Individual Task Completions
  async markTaskComplete(
    kidId: number,
    taskType: "chore" | "extra",
    taskId: number,
    date: string
  ): Promise<TaskCompletion> {
    // First check if already completed
    const existing = await db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.kid_id, kidId),
          eq(taskCompletions.task_type, taskType),
          eq(taskCompletions.task_id, taskId),
          eq(taskCompletions.date, date)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    // Check completion status BEFORE adding the new completion
    let wasAllExtraTasksCompleted = false;
    if (taskType === "extra") {
      const beforeProgress = await this.computeDailyProgress(kidId, date);
      wasAllExtraTasksCompleted = beforeProgress.extraTasksCompleted;
    }

    const result = await db
      .insert(taskCompletions)
      .values({ kid_id: kidId, task_type: taskType, task_id: taskId, date })
      .returning();

    // Award points if this completion changes the status from incomplete to complete
    if (taskType === "extra") {
      const afterProgress = await this.computeDailyProgress(kidId, date);
      if (!wasAllExtraTasksCompleted && afterProgress.extraTasksCompleted) {
        await this.awardPoints(kidId, 1);
      }
    }

    return result[0];
  }

  async unmarkTaskComplete(
    kidId: number,
    taskType: "chore" | "extra",
    taskId: number,
    date: string
  ): Promise<void> {
    // Check completion status BEFORE removing the completion
    let wasAllExtraTasksCompleted = false;
    if (taskType === "extra") {
      const beforeProgress = await this.computeDailyProgress(kidId, date);
      wasAllExtraTasksCompleted = beforeProgress.extraTasksCompleted;
    }

    await db
      .delete(taskCompletions)
      .where(
        and(
          eq(taskCompletions.kid_id, kidId),
          eq(taskCompletions.task_type, taskType),
          eq(taskCompletions.task_id, taskId),
          eq(taskCompletions.date, date)
        )
      );

    // Remove points if this uncompletion changes the status from complete to incomplete
    if (taskType === "extra") {
      const afterProgress = await this.computeDailyProgress(kidId, date);
      if (wasAllExtraTasksCompleted && !afterProgress.extraTasksCompleted) {
        await this.awardPoints(kidId, -1); // Remove 1 point
      }
    }
  }

  async getTaskCompletions(
    kidId: number,
    date: string
  ): Promise<TaskCompletion[]> {
    return await db
      .select()
      .from(taskCompletions)
      .where(
        and(eq(taskCompletions.kid_id, kidId), eq(taskCompletions.date, date))
      );
  }

  async isTaskCompleted(
    kidId: number,
    taskType: "chore" | "extra",
    taskId: number,
    date: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.kid_id, kidId),
          eq(taskCompletions.task_type, taskType),
          eq(taskCompletions.task_id, taskId),
          eq(taskCompletions.date, date)
        )
      );
    return result.length > 0;
  }

  // Daily Progress (computed from individual completions)
  async computeDailyProgress(
    kidId: number,
    date: string
  ): Promise<{
    choresCompleted: boolean;
    extraTasksCompleted: boolean;
    pointsEarned: number;
  }> {
    // Get all active tasks for the kid
    const activeChores = await this.getKidActiveChores(kidId);
    const activeExtraTasks = await this.getKidActiveExtraTasks(kidId);

    // Get completions for the day
    const completions = await this.getTaskCompletions(kidId, date);
    const choreCompletions = completions.filter((c) => c.task_type === "chore");
    const extraCompletions = completions.filter((c) => c.task_type === "extra");

    // Check if all tasks are completed
    const choresCompleted =
      activeChores.length > 0 &&
      activeChores.every((chore) =>
        choreCompletions.some((c) => c.task_id === chore.id)
      );

    const extraTasksCompleted =
      activeExtraTasks.length > 0 &&
      activeExtraTasks.every((task) =>
        extraCompletions.some((c) => c.task_id === task.id)
      );

    // Points earned today (1 point if all extra tasks completed)
    const pointsEarned = extraTasksCompleted ? 1 : 0;

    return { choresCompleted, extraTasksCompleted, pointsEarned };
  }

  async getTaskHistory(
    kidId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    if (kidId) {
      return await db
        .select()
        .from(taskCompletions)
        .where(eq(taskCompletions.kid_id, kidId))
        .orderBy(asc(taskCompletions.completed_at));
    } else {
      return await db
        .select()
        .from(taskCompletions)
        .orderBy(asc(taskCompletions.completed_at));
    }
  }

  // Settings
  async getSetting(key: string): Promise<string | null> {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return result.length > 0 ? result[0].value : null;
  }

  async setSetting(key: string, value: string): Promise<Settings> {
    // Use upsert: try to update, if not exists then insert
    const existing = await this.getSetting(key);

    if (existing !== null) {
      // Update existing setting
      const result = await db
        .update(settings)
        .set({ value, updated_at: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return result[0];
    } else {
      // Insert new setting
      const result = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return result[0];
    }
  }

  async initializeDefaultSettings(): Promise<void> {
    // Initialize admin PIN if it doesn't exist
    const adminPin = await this.getSetting("admin_pin");
    if (adminPin === null) {
      await this.setSetting("admin_pin", "1234"); // Default PIN
    }
  }
}

export const storage = new DatabaseStorage();
