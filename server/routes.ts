import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWorkTaskSchema, insertWorkStationSchema, insertShiftSchema, 
  insertCategorySchema, insertQuestionSchema, insertChecklistSchema,
  insertChecklistWorkTaskSchema,
  insertChecklistResponseSchema, insertAdminSettingSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Work Tasks
  app.get("/api/work-tasks", async (req, res) => {
    try {
      const workTasks = await storage.getWorkTasks();
      res.json(workTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work tasks" });
    }
  });

  app.get("/api/work-tasks/:id", async (req, res) => {
    try {
      const workTask = await storage.getWorkTask(parseInt(req.params.id));
      if (!workTask) {
        return res.status(404).json({ message: "Work task not found" });
      }
      res.json(workTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work task" });
    }
  });

  app.post("/api/work-tasks", async (req, res) => {
    try {
      const validatedData = insertWorkTaskSchema.parse(req.body);
      const workTask = await storage.createWorkTask(validatedData);
      res.status(201).json(workTask);
    } catch (error) {
      res.status(400).json({ message: "Invalid work task data" });
    }
  });

  app.put("/api/work-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkTaskSchema.partial().parse(req.body);
      const workTask = await storage.updateWorkTask(id, validatedData);
      res.json(workTask);
    } catch (error) {
      res.status(400).json({ message: "Invalid work task data" });
    }
  });

  app.patch("/api/work-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkTaskSchema.partial().parse(req.body);
      const workTask = await storage.updateWorkTask(id, validatedData);
      res.json(workTask);
    } catch (error) {
      res.status(400).json({ message: "Invalid work task data" });
    }
  });

  app.delete("/api/work-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkTask(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work task" });
    }
  });

  // Work Stations
  app.get("/api/work-stations", async (req, res) => {
    try {
      const workTaskId = req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined;
      const workStations = await storage.getWorkStations(workTaskId);
      res.json(workStations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work stations" });
    }
  });

  app.post("/api/work-stations", async (req, res) => {
    try {
      const validatedData = insertWorkStationSchema.parse(req.body);
      const workStation = await storage.createWorkStation(validatedData);
      res.status(201).json(workStation);
    } catch (error) {
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.put("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkStationSchema.partial().parse(req.body);
      const workStation = await storage.updateWorkStation(id, validatedData);
      res.json(workStation);
    } catch (error) {
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.patch("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkStationSchema.partial().parse(req.body);
      const workStation = await storage.updateWorkStation(id, validatedData);
      res.json(workStation);
    } catch (error) {
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.delete("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkStation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work station" });
    }
  });

  // Shifts
  app.get("/api/shifts", async (req, res) => {
    try {
      const shifts = await storage.getShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(validatedData);
      res.status(201).json(shift);
    } catch (error) {
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertShiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(id, validatedData);
      res.json(shift);
    } catch (error) {
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.patch("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertShiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(id, validatedData);
      res.json(shift);
    } catch (error) {
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteShift(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const checklistId = req.query.checklistId ? parseInt(req.query.checklistId as string) : null;
      if (!checklistId) {
        return res.status(400).json({ message: "checklistId is required" });
      }
      const categories = await storage.getCategories(checklistId);
      res.json(categories);
    } catch (error) {
      console.error("Categories API error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Questions
  app.get("/api/questions", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
      if (!categoryId) {
        return res.status(400).json({ message: "categoryId is required" });
      }
      const questions = await storage.getQuestions(categoryId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, validatedData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, validatedData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuestion(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Checklists
  app.get("/api/checklists", async (req, res) => {
    try {
      const checklists = await storage.getChecklists();
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklists" });
    }
  });

  app.get("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getChecklist(id);
      if (!checklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  app.get("/api/checklists/active", async (req, res) => {
    try {
      const checklists = await storage.getActiveChecklists();
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active checklists" });
    }
  });

  app.get("/api/checklists/:id", async (req, res) => {
    try {
      const checklist = await storage.getChecklist(parseInt(req.params.id));
      if (!checklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      const validatedData = insertChecklistSchema.parse(req.body);
      const checklist = await storage.createChecklist(validatedData);
      res.status(201).json(checklist);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  app.put("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertChecklistSchema.partial().parse(req.body);
      const checklist = await storage.updateChecklist(id, validatedData);
      res.json(checklist);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  app.patch("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertChecklistSchema.partial().parse(req.body);
      const checklist = await storage.updateChecklist(id, validatedData);
      res.json(checklist);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  app.delete("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChecklist(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete checklist" });
    }
  });

  // Checklist Work Tasks
  app.get("/api/checklists/:id/work-tasks", async (req, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      const workTasks = await storage.getChecklistWorkTasks(checklistId);
      res.json(workTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklist work tasks" });
    }
  });

  app.post("/api/checklists/:id/work-tasks", async (req, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      const validatedData = insertChecklistWorkTaskSchema.parse({
        ...req.body,
        checklistId
      });
      const workTask = await storage.createChecklistWorkTask(validatedData);
      res.status(201).json(workTask);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist work task data" });
    }
  });



  // Checklist Responses
  app.get("/api/responses", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const checklistId = req.query.checklistId ? parseInt(req.query.checklistId as string) : undefined;
      const workTaskId = req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined;
      const workStationId = req.query.workStationId ? parseInt(req.query.workStationId as string) : undefined;
      const shiftId = req.query.shiftId ? parseInt(req.query.shiftId as string) : undefined;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;
      
      const responses = await storage.getChecklistResponses({ 
        limit, 
        offset, 
        checklistId, 
        workTaskId, 
        workStationId, 
        shiftId, 
        startDate, 
        endDate, 
        search 
      });
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.post("/api/responses", async (req, res) => {
    try {
      const validatedData = insertChecklistResponseSchema.parse(req.body);
      const response = await storage.createChecklistResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid response data" });
    }
  });

  app.put("/api/responses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertChecklistResponseSchema.partial().parse(req.body);
      const response = await storage.updateChecklistResponse(id, validatedData);
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid response data" });
    }
  });

  // Dashboard Statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const checklistId = req.query.checklistId ? parseInt(req.query.checklistId as string) : undefined;
      const workTaskId = req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined;
      const workStationId = req.query.workStationId ? parseInt(req.query.workStationId as string) : undefined;
      const shiftId = req.query.shiftId ? parseInt(req.query.shiftId as string) : undefined;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;
      
      const stats = await storage.getDashboardStats({ 
        checklistId, 
        workTaskId, 
        workStationId, 
        shiftId, 
        startDate, 
        endDate, 
        search 
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Dashboard Questions
  app.get("/api/dashboard/questions", async (req, res) => {
    try {
      const checklistId = parseInt(req.query.checklistId as string);
      if (!checklistId) {
        return res.status(400).json({ message: "checklistId is required" });
      }
      const questions = await storage.getDashboardQuestions(checklistId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard questions" });
    }
  });

  // Admin Settings
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const validatedData = insertAdminSettingSchema.parse(req.body);
      const setting = await storage.setAdminSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid admin setting data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
