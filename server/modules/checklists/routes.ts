import express from 'express';
import { 
  insertChecklistSchema, insertCategorySchema, insertQuestionSchema,
  insertWorkTaskSchema, insertWorkStationSchema, insertShiftSchema,
  insertChecklistResponseSchema, insertChecklistWorkTaskSchema
} from '@shared/schema';
import { storage } from '../../storage';
import { authenticateToken, requireModule } from '../../middleware/auth';

const router = express.Router();

// MIDDLEWARE: All checklist routes require authentication and checklist module access
router.use(authenticateToken);
router.use(requireModule('checklists'));

/**
 * CHECKLISTS MODULE ROUTES
 * All routes are tenant-scoped via middleware
 */

// === WORK TASKS ===
router.get('/work-tasks', async (req, res) => {
  try {
    const workTasks = await storage.getWorkTasks(req.tenantId!);
    res.json(workTasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch work tasks" });
  }
});

router.post('/work-tasks', async (req, res) => {
  try {
    const validatedData = insertWorkTaskSchema.parse(req.body);
    const workTask = await storage.createWorkTask({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(workTask);
  } catch (error) {
    res.status(400).json({ message: "Invalid work task data" });
  }
});

router.put('/work-tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertWorkTaskSchema.partial().parse(req.body);
    const workTask = await storage.updateWorkTask(id, validatedData, req.tenantId!);
    res.json(workTask);
  } catch (error) {
    res.status(400).json({ message: "Invalid work task data" });
  }
});

router.delete('/work-tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteWorkTask(id, req.tenantId!);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete work task" });
  }
});

// === WORK STATIONS ===
router.get('/work-stations', async (req, res) => {
  try {
    const workTaskId = req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined;
    const workStations = await storage.getWorkStations(req.tenantId!, workTaskId);
    res.json(workStations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch work stations" });
  }
});

router.post('/work-stations', async (req, res) => {
  try {
    const validatedData = insertWorkStationSchema.parse(req.body);
    const workStation = await storage.createWorkStation({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(workStation);
  } catch (error) {
    res.status(400).json({ message: "Invalid work station data" });
  }
});

router.put('/work-stations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertWorkStationSchema.partial().parse(req.body);
    const workStation = await storage.updateWorkStation(id, validatedData, req.tenantId!);
    res.json(workStation);
  } catch (error) {
    res.status(400).json({ message: "Invalid work station data" });
  }
});

router.delete('/work-stations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteWorkStation(id, req.tenantId!);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete work station" });
  }
});

// === SHIFTS ===
router.get('/shifts', async (req, res) => {
  try {
    const shifts = await storage.getShifts(req.tenantId!);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch shifts" });
  }
});

router.post('/shifts', async (req, res) => {
  try {
    const validatedData = insertShiftSchema.parse(req.body);
    const shift = await storage.createShift({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(shift);
  } catch (error) {
    res.status(400).json({ message: "Invalid shift data" });
  }
});

router.put('/shifts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertShiftSchema.partial().parse(req.body);
    const shift = await storage.updateShift(id, validatedData, req.tenantId!);
    res.json(shift);
  } catch (error) {
    res.status(400).json({ message: "Invalid shift data" });
  }
});

router.delete('/shifts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteShift(id, req.tenantId!);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete shift" });
  }
});

// === CHECKLISTS ===
router.get('/checklists', async (req, res) => {
  try {
    const checklists = await storage.getChecklists(req.tenantId!);
    res.json(checklists);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch checklists" });
  }
});

router.get('/checklists/active', async (req, res) => {
  try {
    const activeChecklists = await storage.getActiveChecklists(req.tenantId!);
    res.json(activeChecklists);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active checklists" });
  }
});

router.get('/checklists/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const checklist = await storage.getChecklist(id, req.tenantId!);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch checklist" });
  }
});

router.post('/checklists', async (req, res) => {
  try {
    const validatedData = insertChecklistSchema.parse(req.body);
    const checklist = await storage.createChecklist({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(checklist);
  } catch (error) {
    res.status(400).json({ message: "Invalid checklist data" });
  }
});

router.put('/checklists/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertChecklistSchema.partial().parse(req.body);
    const checklist = await storage.updateChecklist(id, validatedData, req.tenantId!);
    res.json(checklist);
  } catch (error) {
    res.status(400).json({ message: "Invalid checklist data" });
  }
});

router.delete('/checklists/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteChecklist(id, req.tenantId!);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete checklist" });
  }
});

// === CATEGORIES ===
router.get('/checklists/:checklistId/categories', async (req, res) => {
  try {
    const checklistId = parseInt(req.params.checklistId);
    const categories = await storage.getCategories(checklistId, req.tenantId!);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const validatedData = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: "Invalid category data" });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertCategorySchema.partial().parse(req.body);
    const category = await storage.updateCategory(id, validatedData, req.tenantId!);
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "Invalid category data" });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id, req.tenantId!);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category" });
  }
});

// === QUESTIONS ===
router.get('/categories/:categoryId/questions', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const questions = await storage.getQuestions(categoryId, req.tenantId!);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const validatedData = insertQuestionSchema.parse(req.body);
    const question = await storage.createQuestion({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: "Invalid question data" });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertQuestionSchema.partial().parse(req.body);
    const question = await storage.updateQuestion(id, validatedData, req.tenantId!);
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: "Invalid question data" });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteQuestion(id, req.tenantId!);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete question" });
  }
});

// === CHECKLIST RESPONSES ===
router.get('/responses', async (req, res) => {
  try {
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      checklistId: req.query.checklistId ? parseInt(req.query.checklistId as string) : undefined,
      workTaskId: req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined,
      workStationId: req.query.workStationId ? parseInt(req.query.workStationId as string) : undefined,
      shiftId: req.query.shiftId ? parseInt(req.query.shiftId as string) : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    };
    
    const responses = await storage.getChecklistResponses(req.tenantId!, filters);
    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch responses" });
  }
});

router.get('/responses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const response = await storage.getChecklistResponse(id, req.tenantId!);
    if (!response) {
      return res.status(404).json({ message: "Response not found" });
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch response" });
  }
});

router.post('/responses', async (req, res) => {
  try {
    const validatedData = insertChecklistResponseSchema.parse(req.body);
    const response = await storage.createChecklistResponse({
      ...validatedData,
      tenantId: req.tenantId!
    });
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: "Invalid response data" });
  }
});

// === DASHBOARD ===
router.get('/dashboard/stats', async (req, res) => {
  try {
    const filters = {
      checklistId: req.query.checklistId ? parseInt(req.query.checklistId as string) : undefined,
      workTaskId: req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined,
      workStationId: req.query.workStationId ? parseInt(req.query.workStationId as string) : undefined,
      shiftId: req.query.shiftId ? parseInt(req.query.shiftId as string) : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    };
    
    const stats = await storage.getDashboardStats(req.tenantId!, filters);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

router.get('/checklists/:checklistId/dashboard/questions', async (req, res) => {
  try {
    const checklistId = parseInt(req.params.checklistId);
    const questions = await storage.getDashboardQuestions(checklistId, req.tenantId!);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard questions" });
  }
});

export default router;