import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
}

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

  // Get kid's current active chores (based on their A or B list assignment)
  app.get("/api/kids/:id/chores", async (req, res) => {
    try {
      const kidId = parseInt(req.params.id);
      const date = (req.query.date as string) || getCurrentDate();

      const chores = await storage.getKidActiveChores(kidId);

      // Add completion status for each chore
      const choresWithStatus = await Promise.all(
        chores.map(async (chore) => ({
          ...chore,
          completed: await storage.isTaskCompleted(
            kidId,
            "chore",
            chore.id,
            date
          ),
        }))
      );

      res.json(choresWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch kid's chores" });
    }
  });

  // Get kid's active extra tasks
  app.get("/api/kids/:id/extra-tasks", async (req, res) => {
    try {
      const kidId = parseInt(req.params.id);
      const date = (req.query.date as string) || getCurrentDate();

      const extraTasks = await storage.getKidActiveExtraTasks(kidId);

      // Add completion status for each extra task
      const extraTasksWithStatus = await Promise.all(
        extraTasks.map(async (task) => ({
          ...task,
          completed: await storage.isTaskCompleted(
            kidId,
            "extra",
            task.id,
            date
          ),
        }))
      );

      res.json(extraTasksWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch kid's extra tasks" });
    }
  });

  // Get kid's daily progress (computed from individual completions)
  app.get("/api/kids/:id/progress", async (req, res) => {
    try {
      const kidId = parseInt(req.params.id);
      const date = (req.query.date as string) || getCurrentDate();

      const progress = await storage.computeDailyProgress(kidId, date);

      res.json({
        kid_id: kidId,
        date,
        chores_completed: progress.choresCompleted,
        extra_tasks_completed: progress.extraTasksCompleted,
        points_earned_today: progress.pointsEarned,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily progress" });
    }
  });

  // Toggle individual task completion
  app.post(
    "/api/kids/:kidId/tasks/:taskType/:taskId/toggle",
    async (req, res) => {
      try {
        const kidId = parseInt(req.params.kidId);
        const taskType = req.params.taskType as "chore" | "extra";
        const taskId = parseInt(req.params.taskId);
        const date = req.body.date || getCurrentDate();

        if (taskType !== "chore" && taskType !== "extra") {
          return res
            .status(400)
            .json({ message: "Task type must be 'chore' or 'extra'" });
        }

        const isCompleted = await storage.isTaskCompleted(
          kidId,
          taskType,
          taskId,
          date
        );

        if (isCompleted) {
          await storage.unmarkTaskComplete(kidId, taskType, taskId, date);
        } else {
          await storage.markTaskComplete(kidId, taskType, taskId, date);
        }

        // Get updated progress
        const progress = await storage.computeDailyProgress(kidId, date);
        const kid = await storage.getKid(kidId);

        res.json({
          message: `Task ${isCompleted ? "unmarked" : "marked"} as ${
            isCompleted ? "incomplete" : "complete"
          }`,
          progress: {
            chores_completed: progress.choresCompleted,
            extra_tasks_completed: progress.extraTasksCompleted,
            points_earned_today: progress.pointsEarned,
          },
          kid_points: kid?.points || 0,
          allowance_status: progress.choresCompleted
            ? "$16 weekly allowance on track"
            : "Complete all chores for allowance",
          bonus_status: progress.extraTasksCompleted
            ? "$4 weekly bonus earned"
            : "Complete all extra tasks for bonus",
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to toggle task completion" });
      }
    }
  );

  // Admin: Switch all kids' A/B lists (weekly reset)
  app.post("/api/admin/switch-lists", async (req, res) => {
    try {
      await storage.switchKidLists();
      const kids = await storage.getAllKids();
      res.json({
        message: "All kids switched to opposite chore lists",
        kids,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to switch lists" });
    }
  });

  // Admin: Award points manually
  app.post("/api/admin/award-points", async (req, res) => {
    try {
      const { kidId, points } = req.body;
      if (!kidId || points === undefined) {
        return res
          .status(400)
          .json({ message: "kidId and points are required" });
      }

      await storage.awardPoints(kidId, points);
      const kid = await storage.getKid(kidId);

      res.json({
        message: `${points} points awarded`,
        kid,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to award points" });
    }
  });

  // Admin: Add new chore
  app.post("/api/admin/chores", async (req, res) => {
    try {
      const { list_name, chore_name } = req.body;
      if (!list_name || !chore_name) {
        return res
          .status(400)
          .json({ message: "list_name and chore_name are required" });
      }

      const chore = await storage.addChore({ list_name, chore_name });
      res.json({ message: "Chore added", chore });
    } catch (error) {
      res.status(500).json({ message: "Failed to add chore" });
    }
  });

  // Admin: Deactivate chore
  app.post("/api/admin/chores/:id/deactivate", async (req, res) => {
    try {
      const choreId = parseInt(req.params.id);
      await storage.deactivateChore(choreId);
      res.json({ message: "Chore deactivated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate chore" });
    }
  });

  // Admin: Add new extra task
  app.post("/api/admin/extra-tasks", async (req, res) => {
    try {
      const { kid_id, task_name } = req.body;
      if (!kid_id || !task_name) {
        return res
          .status(400)
          .json({ message: "kid_id and task_name are required" });
      }

      const task = await storage.addExtraTask({ kid_id, task_name });
      res.json({ message: "Extra task added", task });
    } catch (error) {
      res.status(500).json({ message: "Failed to add extra task" });
    }
  });

  // Admin: Deactivate extra task
  app.post("/api/admin/extra-tasks/:id/deactivate", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.deactivateExtraTask(taskId);
      res.json({ message: "Extra task deactivated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate extra task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
