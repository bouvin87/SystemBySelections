import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import checklistRoutes from "./modules/checklists/routes";
import deviationRoutes from "./modules/deviations/routes";
import superAdminRoutes from "./routes/super-admin";
import { resolveTenant } from "./middleware/tenant";
import { 
  authenticateToken, 
  validateTenantOwnership, 
  enforceTenantIsolation,
  requireModule
} from "./middleware/auth";
import { storage } from "./storage";
import {
  insertWorkTaskSchema, insertWorkStationSchema, insertShiftSchema,
  insertChecklistSchema, insertCategorySchema, insertQuestionSchema,
  insertUserSchema, insertChecklistResponseSchema, insertDeviationTypeSchema
} from "@shared/schema";

// Extend Request type for authenticated routes
interface AuthenticatedRequest extends Request {
  user?: any;
  tenantId?: number;
  tenant?: any;
}

/**
 * MULTI-TENANT SAAS ROUTE REGISTRATION
 * 
 * Architecture:
 * - /api/auth/* - Authentication endpoints (login, register, tenant management)
 * - /api/modules/checklists/* - Checklist module routes (tenant-scoped)
 * - All routes are tenant-aware and use JWT authentication
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  // === AUTHENTICATION ROUTES ===
  // Public routes for login, register, and tenant management (handle their own tenant resolution)
  app.use('/api/auth', authRoutes);

  // === SUPER ADMIN ROUTES ===
  // Protected routes for superadmin functionality (tenant and module management)
  app.use('/api/super-admin', superAdminRoutes);

  // === GLOBAL SECURITY MIDDLEWARE ===
  // Apply comprehensive security to all protected routes
  app.use('/api', (req, res, next) => {
    // Skip security for public routes
    if (req.path.startsWith('/auth') || req.path === '/health') {
      return next();
    }
    
    // Chain security middleware: authentication -> tenant isolation -> ownership validation
    authenticateToken(req, res, () => {
      enforceTenantIsolation(req, res, () => {
        validateTenantOwnership(req, res, next);
      });
    });
  });

  // Tenant resolution middleware for module routes
  app.use('/api/modules', resolveTenant);

  // === MODULE ROUTES ===
  // Checklist module - protected and tenant-scoped
  app.use('/api/modules/checklists', requireModule('checklists'), checklistRoutes);
  
  // ===== DEVIATION TYPES ROUTES (BEFORE MODULE ROUTES) =====
  
  // GET /api/deviations/types - Get all deviation types
  app.get('/api/deviations/types', 
    authenticateToken, 
    requireModule('deviations'), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationTypes = await storage.getDeviationTypes(tenantId);
        res.json(deviationTypes);
        
      } catch (error) {
        console.error('Error fetching deviation types:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/deviations/types - Create deviation type
  app.post('/api/deviations/types', 
    authenticateToken, 
    requireModule('deviations'), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        
        const validatedData = insertDeviationTypeSchema.parse({
          ...req.body,
          tenantId,
        });
        
        const deviationType = await storage.createDeviationType(validatedData);
        res.status(201).json(deviationType);
        
      } catch (error) {
        console.error('Error creating deviation type:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/deviations/types/:id - Update deviation type
  app.patch('/api/deviations/types/:id', 
    authenticateToken, 
    requireModule('deviations'), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationTypeId = parseInt(req.params.id);
        
        if (isNaN(deviationTypeId)) {
          return res.status(400).json({ message: 'Invalid deviation type ID' });
        }
        
        const deviationType = await storage.updateDeviationType(deviationTypeId, req.body, tenantId);
        res.json(deviationType);
        
      } catch (error) {
        if (error instanceof Error && error.message === 'Deviation type not found') {
          return res.status(404).json({ message: 'Deviation type not found' });
        }
        console.error('Error updating deviation type:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // DELETE /api/deviations/types/:id - Delete deviation type
  app.delete('/api/deviations/types/:id', 
    authenticateToken, 
    requireModule('deviations'), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationTypeId = parseInt(req.params.id);
        
        if (isNaN(deviationTypeId)) {
          return res.status(400).json({ message: 'Invalid deviation type ID' });
        }
        
        await storage.deleteDeviationType(deviationTypeId, tenantId);
        res.status(204).send();
        
      } catch (error) {
        if (error instanceof Error && error.message === 'Deviation type not found') {
          return res.status(404).json({ message: 'Deviation type not found' });
        }
        console.error('Error deleting deviation type:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // Deviations module - protected and tenant-scoped  
  deviationRoutes(app);

  // === USER MANAGEMENT ROUTES ===
  // Get all users for the tenant (admin only)
  app.get('/api/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can view all users
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getUsers(req.tenantId!);
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create a new user (admin only)
  app.post('/api/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can create users
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Handle password hashing for new users
      const { password, ...userData } = req.body;
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      // Hash the password and prepare user data
      const { hashPassword } = await import('./middleware/auth');
      const hashedPassword = await hashPassword(password);
      
      const validatedData = insertUserSchema.parse({
        ...userData,
        hashedPassword,
        tenantId: req.tenantId!
      });

      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ message: "Invalid user data or email already exists" });
    }
  });

  // Update a user (admin only)
  app.patch('/api/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can update users
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const id = parseInt(req.params.id);
      const validatedData = insertUserSchema.partial().parse(req.body);
      
      // Ensure the user belongs to the same tenant
      const existingUser = await storage.getUser(id);
      if (!existingUser || existingUser.tenantId !== req.tenantId!) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = await storage.updateUser(id, validatedData);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Delete a user (admin only)
  app.delete('/api/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can delete users
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const id = parseInt(req.params.id);
      
      // Ensure the user belongs to the same tenant and isn't trying to delete themselves
      const existingUser = await storage.getUser(id);
      if (!existingUser || existingUser.tenantId !== req.tenantId!) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (existingUser.id === req.user?.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      await storage.deleteUser(id);
      res.status(200).json({ message: "User deleted" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // === HEALTH CHECK ===
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '2.0.0-multitenant'
    });
  });

  // === MODULE STATUS ENDPOINT ===
  // Returns active modules for the current tenant
  app.get('/api/modules', async (req, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ message: 'Tenant not resolved' });
      }

      res.json({
        tenant: {
          name: req.tenant.name,
          id: req.tenant.id,
        },
        modules: req.tenant.modules,
        availableModules: [
          {
            name: 'checklists',
            displayName: 'Checklistor',
            description: 'Digital checklists for production logging',
            enabled: req.tenant.modules.includes('checklists')
          },
          {
            name: 'maintenance',
            displayName: 'Underhåll',
            description: 'Maintenance management system',
            enabled: req.tenant.modules.includes('maintenance')
          }
        ]
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch module status' });
    }
  });

  // === BACKWARD COMPATIBILITY ROUTES ===
  // Direct routes using old storage for backward compatibility
  
  const { storage } = await import('./storage');
  
  // Work Tasks - require checklists module
  app.get('/api/work-tasks', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const workTasks = await storage.getWorkTasks(req.tenantId!);
      res.json(workTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work tasks" });
    }
  });

  app.post('/api/work-tasks', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const { tenantId, ...validatedData } = insertWorkTaskSchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const workTask = await storage.createWorkTask({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(workTask);
    } catch (error) {
      console.error('Create work task error:', error);
      res.status(400).json({ message: "Invalid work task data" });
    }
  });

  app.patch('/api/work-tasks/:id', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkTaskSchema.partial().parse(req.body);
      const workTask = await storage.updateWorkTask(id, validatedData, req.tenantId!);
      res.json(workTask);
    } catch (error) {
      console.error('Update work task error:', error);
      res.status(400).json({ message: "Invalid work task data" });
    }
  });

  app.delete('/api/work-tasks/:id', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkTask(id, req.tenantId!);
      res.status(200).json({ message: "Work task deleted" });
    } catch (error) {
      console.error('Delete work task error:', error);
      res.status(500).json({ message: "Failed to delete work task" });
    }
  });

  // Work Stations - require checklists module
  app.get('/api/work-stations', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const workTaskId = req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined;
      const workStations = await storage.getWorkStations(req.tenantId!, workTaskId);
      res.json(workStations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work stations" });
    }
  });

  app.post('/api/work-stations', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const { tenantId, ...validatedData } = insertWorkStationSchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const workStation = await storage.createWorkStation({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(workStation);
    } catch (error) {
      console.error('Create work station error:', error);
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.patch('/api/work-stations/:id', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkStationSchema.partial().parse(req.body);
      const workStation = await storage.updateWorkStation(id, validatedData, req.tenantId!);
      res.json(workStation);
    } catch (error) {
      console.error('Update work station error:', error);
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.delete('/api/work-stations/:id', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkStation(id, req.tenantId!);
      res.status(200).json({ message: "Work station deleted" });
    } catch (error) {
      console.error('Delete work station error:', error);
      res.status(500).json({ message: "Failed to delete work station" });
    }
  });

  // Shifts
  app.get('/api/shifts', authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getShifts(req.tenantId!);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post('/api/shifts', authenticateToken, async (req, res) => {
    try {
      const { tenantId, ...validatedData } = insertShiftSchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const shift = await storage.createShift({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(shift);
    } catch (error) {
      console.error('Create shift error:', error);
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.patch('/api/shifts/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertShiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(id, validatedData, req.tenantId!);
      res.json(shift);
    } catch (error) {
      console.error('Update shift error:', error);
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.delete('/api/shifts/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteShift(id, req.tenantId!);
      res.status(200).json({ message: "Shift deleted" });
    } catch (error) {
      console.error('Delete shift error:', error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Checklists
  app.get('/api/checklists', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const checklists = await storage.getChecklists(req.tenantId!);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklists" });
    }
  });

  app.get('/api/checklists/active', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const checklists = await storage.getActiveChecklists(req.tenantId!);
      res.json(checklists);
    } catch (error) {
      console.error('Get active checklists error:', error);
      res.status(500).json({ message: "Failed to fetch active checklists" });
    }
  });

  app.get('/api/checklists/all-active', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const checklists = await storage.getAllActiveChecklists(req.tenantId!);
      res.json(checklists);
    } catch (error) {
      console.error('Get all active checklists error:', error);
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  app.post('/api/checklists', authenticateToken, async (req, res) => {
    try {
      const { tenantId, ...validatedData } = insertChecklistSchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const checklist = await storage.createChecklist({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(checklist);
    } catch (error) {
      console.error('Create checklist error:', error);
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  app.patch('/api/checklists/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertChecklistSchema.partial().parse(req.body);
      const checklist = await storage.updateChecklist(id, validatedData, req.tenantId!);
      res.json(checklist);
    } catch (error) {
      console.error('Update checklist error:', error);
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  app.delete('/api/checklists/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChecklist(id, req.tenantId!);
      res.status(200).json({ message: "Checklist deleted" });
    } catch (error) {
      console.error('Delete checklist error:', error);
      res.status(500).json({ message: "Failed to delete checklist" });
    }
  });

  // Checklist Work Tasks endpoints
  app.get('/api/checklists/:id/work-tasks', authenticateToken, async (req, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      const workTasks = await storage.getChecklistWorkTasks(checklistId, req.tenantId!);
      res.json(workTasks);
    } catch (error) {
      console.error('Get checklist work tasks error:', error);
      res.status(500).json({ message: "Failed to fetch checklist work tasks" });
    }
  });

  app.post('/api/checklists/:id/work-tasks', authenticateToken, async (req, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      const { workTaskId } = req.body;
      const checklistWorkTask = await storage.createChecklistWorkTask({
        checklistId,
        workTaskId,
        tenantId: req.tenantId!
      });
      res.status(201).json(checklistWorkTask);
    } catch (error) {
      console.error('Create checklist work task error:', error);
      res.status(400).json({ message: "Failed to create checklist work task" });
    }
  });

  app.delete('/api/checklists/:id/work-tasks', authenticateToken, async (req, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      // Delete all work task relationships for this checklist
      await storage.deleteAllChecklistWorkTasks(checklistId, req.tenantId!);
      res.status(200).json({ message: "Checklist work tasks deleted" });
    } catch (error) {
      console.error('Delete checklist work tasks error:', error);
      res.status(500).json({ message: "Failed to delete checklist work tasks" });
    }
  });

  // === CATEGORIES ===
  app.get("/api/categories", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const checklistId = req.query.checklistId ? parseInt(req.query.checklistId as string) : null;
      if (!checklistId) {
        return res.status(400).json({ message: "checklistId is required" });
      }
      const categories = await storage.getCategories(checklistId, req.tenantId!);
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId, ...validatedData } = insertCategorySchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const category = await storage.createCategory({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(category);
    } catch (error) {
      console.error('Create category error:', error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.patch("/api/categories/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData, req.tenantId!);
      res.json(category);
    } catch (error) {
      console.error('Update category error:', error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id, req.tenantId!);
      res.status(200).json({ message: "Category deleted" });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // === QUESTIONS ===
  app.get("/api/questions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
      if (!categoryId) {
        return res.status(400).json({ message: "categoryId is required" });
      }
      const questions = await storage.getQuestions(categoryId, req.tenantId!);
      res.json(questions);
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId, ...validatedData } = insertQuestionSchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const question = await storage.createQuestion({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(question);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.patch("/api/questions/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, validatedData, req.tenantId!);
      res.json(question);
    } catch (error) {
      console.error('Update question error:', error);
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.delete("/api/questions/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuestion(id, req.tenantId!);
      res.status(200).json({ message: "Question deleted" });
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Question Work Tasks routes
  app.get("/api/questions/:id/work-tasks", authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const questionWorkTasks = await storage.getQuestionWorkTasks(questionId, req.tenantId!);
      res.json(questionWorkTasks);
    } catch (error) {
      console.error("Error fetching question work tasks:", error);
      res.status(500).json({ message: "Failed to fetch question work tasks" });
    }
  });

  app.post("/api/questions/:id/work-tasks", authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const { workTaskIds } = req.body;

      // First delete all existing relations for this question
      await storage.deleteAllQuestionWorkTasks(questionId, req.tenantId!);

      // Then create new relations for each selected work task
      const createdRelations = [];
      for (const workTaskId of workTaskIds) {
        const relation = await storage.createQuestionWorkTask({
          tenantId: req.tenantId!,
          questionId,
          workTaskId
        });
        createdRelations.push(relation);
      }

      res.status(201).json(createdRelations);
    } catch (error) {
      console.error("Error creating question work tasks:", error);
      res.status(500).json({ message: "Failed to create question work tasks" });
    }
  });

  // === MISSING BACKWARD COMPATIBILITY ROUTES ===
  
  // Individual checklist access
  app.get('/api/checklists/:id', authenticateToken, requireModule('checklists'), async (req, res) => {
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

  // All active checklists
  app.get('/api/checklists/all-active', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const checklists = await storage.getAllActiveChecklists(req.tenantId!);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all active checklists" });
    }
  });

  // Checklist responses
  app.get('/api/responses', authenticateToken, requireModule('checklists'), async (req, res) => {
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

  // Get single response by ID
  app.get('/api/responses/:id', authenticateToken, requireModule('checklists'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const response = await storage.getChecklistResponse(id, req.tenantId!);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      res.json(response);
    } catch (error) {
      console.error('Get response error:', error);
      res.status(500).json({ message: "Failed to fetch response" });
    }
  });

  app.post('/api/responses', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const { tenantId, ...validatedData } = insertChecklistResponseSchema.parse({
        ...req.body,
        tenantId: req.tenantId!
      });
      const response = await storage.createChecklistResponse({
        ...validatedData,
        tenantId: req.tenantId!
      });
      res.status(201).json(response);
    } catch (error) {
      console.error('Create response error:', error);
      res.status(400).json({ message: "Invalid response data" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', authenticateToken, requireModule('checklists'), async (req, res) => {
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

  app.get('/api/dashboard/questions', authenticateToken, requireModule('checklists'), async (req, res) => {
    try {
      const checklistId = req.query.checklistId ? parseInt(req.query.checklistId as string) : undefined;
      if (!checklistId) {
        return res.status(400).json({ message: "checklistId is required" });
      }
      const questions = await storage.getDashboardQuestions(checklistId, req.tenantId!);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard questions" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}