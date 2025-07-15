import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertKidSchema, insertChoreSchema, insertRewardSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Kids routes
  app.get("/api/kids", async (req, res) => {
    try {
      const kids = await storage.getAllKids();
      res.json(kids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch kids" });
    }
  });

  app.get("/api/kids/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const kid = await storage.getKid(id);
      if (!kid) {
        return res.status(404).json({ message: "Kid not found" });
      }
      res.json(kid);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch kid" });
    }
  });

  app.post("/api/kids", async (req, res) => {
    try {
      const validatedData = insertKidSchema.parse(req.body);
      const kid = await storage.createKid(validatedData);
      res.status(201).json(kid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create kid" });
    }
  });

  app.patch("/api/kids/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const kid = await storage.updateKid(id, updates);
      if (!kid) {
        return res.status(404).json({ message: "Kid not found" });
      }
      res.json(kid);
    } catch (error) {
      res.status(500).json({ message: "Failed to update kid" });
    }
  });

  app.delete("/api/kids/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteKid(id);
      if (!deleted) {
        return res.status(404).json({ message: "Kid not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete kid" });
    }
  });

  // Chores routes
  app.get("/api/chores", async (req, res) => {
    try {
      const kidId = req.query.kidId ? parseInt(req.query.kidId as string) : undefined;
      const chores = kidId ? await storage.getChoresByKid(kidId) : await storage.getAllChores();
      res.json(chores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chores" });
    }
  });

  app.post("/api/chores", async (req, res) => {
    try {
      const validatedData = insertChoreSchema.parse(req.body);
      const chore = await storage.createChore(validatedData);
      res.status(201).json(chore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chore" });
    }
  });

  app.patch("/api/chores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const chore = await storage.updateChore(id, updates);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      res.json(chore);
    } catch (error) {
      res.status(500).json({ message: "Failed to update chore" });
    }
  });

  app.delete("/api/chores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChore(id);
      if (!deleted) {
        return res.status(404).json({ message: "Chore not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chore" });
    }
  });

  // Toggle chore completion
  app.patch("/api/chores/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chore = await storage.getChore(id);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      const completed = !chore.completed;
      const updatedChore = await storage.updateChore(id, { completed });
      
      // Award or remove stars based on completion
      if (completed) {
        await storage.awardStars(chore.kidId, chore.starValue);
      } else {
        await storage.awardStars(chore.kidId, -chore.starValue);
      }
      
      res.json(updatedChore);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle chore completion" });
    }
  });

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const kidId = req.query.kidId ? parseInt(req.query.kidId as string) : undefined;
      if (!kidId) {
        return res.status(400).json({ message: "kidId is required" });
      }
      const achievements = await storage.getAchievementsByKid(kidId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Rewards routes
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      const validatedData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(validatedData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  // Special operations
  app.post("/api/reset-weekly", async (req, res) => {
    try {
      await storage.resetWeeklyChores();
      res.json({ message: "Weekly chores reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset weekly chores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
