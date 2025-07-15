import { kids, chores, achievements, rewards, type Kid, type InsertKid, type Chore, type InsertChore, type Achievement, type InsertAchievement, type Reward, type InsertReward } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Kids
  getAllKids(): Promise<Kid[]>;
  getKid(id: number): Promise<Kid | undefined>;
  createKid(kid: InsertKid): Promise<Kid>;
  updateKid(id: number, updates: Partial<Kid>): Promise<Kid | undefined>;
  deleteKid(id: number): Promise<boolean>;

  // Chores
  getAllChores(): Promise<Chore[]>;
  getChoresByKid(kidId: number): Promise<Chore[]>;
  getChore(id: number): Promise<Chore | undefined>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(id: number, updates: Partial<Chore>): Promise<Chore | undefined>;
  deleteChore(id: number): Promise<boolean>;

  // Achievements
  getAchievementsByKid(kidId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, updates: Partial<Achievement>): Promise<Achievement | undefined>;

  // Rewards
  getAllRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<boolean>;

  // Special operations
  resetWeeklyChores(): Promise<void>;
  awardStars(kidId: number, stars: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Kids
  async getAllKids(): Promise<Kid[]> {
    return await db.select().from(kids);
  }

  async getKid(id: number): Promise<Kid | undefined> {
    const [kid] = await db.select().from(kids).where(eq(kids.id, id));
    return kid || undefined;
  }

  async createKid(kid: InsertKid): Promise<Kid> {
    const [newKid] = await db
      .insert(kids)
      .values(kid)
      .returning();
    return newKid;
  }

  async updateKid(id: number, updates: Partial<Kid>): Promise<Kid | undefined> {
    const [updatedKid] = await db
      .update(kids)
      .set(updates)
      .where(eq(kids.id, id))
      .returning();
    return updatedKid || undefined;
  }

  async deleteKid(id: number): Promise<boolean> {
    // Delete associated chores and achievements first
    await db.delete(chores).where(eq(chores.kidId, id));
    await db.delete(achievements).where(eq(achievements.kidId, id));
    
    const result = await db.delete(kids).where(eq(kids.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Chores
  async getAllChores(): Promise<Chore[]> {
    return await db.select().from(chores);
  }

  async getChoresByKid(kidId: number): Promise<Chore[]> {
    return await db.select().from(chores).where(eq(chores.kidId, kidId));
  }

  async getChore(id: number): Promise<Chore | undefined> {
    const [chore] = await db.select().from(chores).where(eq(chores.id, id));
    return chore || undefined;
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    const [newChore] = await db
      .insert(chores)
      .values(chore)
      .returning();
    return newChore;
  }

  async updateChore(id: number, updates: Partial<Chore>): Promise<Chore | undefined> {
    const [updatedChore] = await db
      .update(chores)
      .set(updates)
      .where(eq(chores.id, id))
      .returning();
    return updatedChore || undefined;
  }

  async deleteChore(id: number): Promise<boolean> {
    const result = await db.delete(chores).where(eq(chores.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Achievements
  async getAchievementsByKid(kidId: number): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.kidId, kidId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async updateAchievement(id: number, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const [updatedAchievement] = await db
      .update(achievements)
      .set(updates)
      .where(eq(achievements.id, id))
      .returning();
    return updatedAchievement || undefined;
  }

  // Rewards
  async getAllRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db
      .insert(rewards)
      .values(reward)
      .returning();
    return newReward;
  }

  async updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined> {
    const [updatedReward] = await db
      .update(rewards)
      .set(updates)
      .where(eq(rewards.id, id))
      .returning();
    return updatedReward || undefined;
  }

  async deleteReward(id: number): Promise<boolean> {
    const result = await db.delete(rewards).where(eq(rewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Special operations
  async resetWeeklyChores(): Promise<void> {
    await db
      .update(chores)
      .set({ completed: false })
      .where(eq(chores.type, "weekly"));
  }

  async awardStars(kidId: number, stars: number): Promise<void> {
    const kid = await this.getKid(kidId);
    if (kid) {
      await db
        .update(kids)
        .set({ stars: kid.stars + stars })
        .where(eq(kids.id, kidId));
    }
  }
}

export const storage = new DatabaseStorage();
