import { kids, chores, achievements, rewards, type Kid, type InsertKid, type Chore, type InsertChore, type Achievement, type InsertAchievement, type Reward, type InsertReward } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private kids: Map<number, Kid> = new Map();
  private chores: Map<number, Chore> = new Map();
  private achievements: Map<number, Achievement> = new Map();
  private rewards: Map<number, Reward> = new Map();
  private currentKidId = 1;
  private currentChoreId = 1;
  private currentAchievementId = 1;
  private currentRewardId = 1;

  constructor() {
    // Initialize with default kids and rewards
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Create default kids
    const defaultKids = [
      { name: "Emma", stars: 12, color: "#FF6B6B" },
      { name: "Liam", stars: 8, color: "#4ECDC4" },
      { name: "Mia", stars: 15, color: "#45B7D1" }
    ];

    defaultKids.forEach(kid => {
      const newKid: Kid = { ...kid, id: this.currentKidId++ };
      this.kids.set(newKid.id, newKid);
    });

    // Create default rewards
    const defaultRewards = [
      { name: "Ice Cream", description: "Enjoy a special treat!", icon: "ice-cream", starCost: 10, color: "#FFB347" },
      { name: "Extra Screen Time", description: "30 minutes bonus gaming!", icon: "gamepad", starCost: 15, color: "#FF6B6B" },
      { name: "Fun Outing", description: "Choose your adventure!", icon: "bicycle", starCost: 25, color: "#4ECDC4" }
    ];

    defaultRewards.forEach(reward => {
      const newReward: Reward = { ...reward, id: this.currentRewardId++ };
      this.rewards.set(newReward.id, newReward);
    });
  }

  // Kids
  async getAllKids(): Promise<Kid[]> {
    return Array.from(this.kids.values());
  }

  async getKid(id: number): Promise<Kid | undefined> {
    return this.kids.get(id);
  }

  async createKid(kid: InsertKid): Promise<Kid> {
    const newKid: Kid = { ...kid, id: this.currentKidId++ };
    this.kids.set(newKid.id, newKid);
    return newKid;
  }

  async updateKid(id: number, updates: Partial<Kid>): Promise<Kid | undefined> {
    const kid = this.kids.get(id);
    if (!kid) return undefined;
    
    const updatedKid = { ...kid, ...updates, id };
    this.kids.set(id, updatedKid);
    return updatedKid;
  }

  async deleteKid(id: number): Promise<boolean> {
    const deleted = this.kids.delete(id);
    if (deleted) {
      // Also delete associated chores and achievements
      this.chores.forEach((chore, choreId) => {
        if (chore.kidId === id) {
          this.chores.delete(choreId);
        }
      });
      this.achievements.forEach((achievement, achievementId) => {
        if (achievement.kidId === id) {
          this.achievements.delete(achievementId);
        }
      });
    }
    return deleted;
  }

  // Chores
  async getAllChores(): Promise<Chore[]> {
    return Array.from(this.chores.values());
  }

  async getChoresByKid(kidId: number): Promise<Chore[]> {
    return Array.from(this.chores.values()).filter(chore => chore.kidId === kidId);
  }

  async getChore(id: number): Promise<Chore | undefined> {
    return this.chores.get(id);
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    const newChore: Chore = { ...chore, id: this.currentChoreId++ };
    this.chores.set(newChore.id, newChore);
    return newChore;
  }

  async updateChore(id: number, updates: Partial<Chore>): Promise<Chore | undefined> {
    const chore = this.chores.get(id);
    if (!chore) return undefined;
    
    const updatedChore = { ...chore, ...updates, id };
    this.chores.set(id, updatedChore);
    return updatedChore;
  }

  async deleteChore(id: number): Promise<boolean> {
    return this.chores.delete(id);
  }

  // Achievements
  async getAchievementsByKid(kidId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(achievement => achievement.kidId === kidId);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const newAchievement: Achievement = { ...achievement, id: this.currentAchievementId++ };
    this.achievements.set(newAchievement.id, newAchievement);
    return newAchievement;
  }

  async updateAchievement(id: number, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement = { ...achievement, ...updates, id };
    this.achievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  // Rewards
  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const newReward: Reward = { ...reward, id: this.currentRewardId++ };
    this.rewards.set(newReward.id, newReward);
    return newReward;
  }

  async updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (!reward) return undefined;
    
    const updatedReward = { ...reward, ...updates, id };
    this.rewards.set(id, updatedReward);
    return updatedReward;
  }

  async deleteReward(id: number): Promise<boolean> {
    return this.rewards.delete(id);
  }

  // Special operations
  async resetWeeklyChores(): Promise<void> {
    this.chores.forEach((chore, id) => {
      if (chore.type === "weekly") {
        this.chores.set(id, { ...chore, completed: false });
      }
    });
  }

  async awardStars(kidId: number, stars: number): Promise<void> {
    const kid = this.kids.get(kidId);
    if (kid) {
      this.kids.set(kidId, { ...kid, stars: kid.stars + stars });
    }
  }
}

export const storage = new MemStorage();
