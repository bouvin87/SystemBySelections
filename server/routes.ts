import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import checklistRoutes from "./modules/checklists/routes";
import { resolveTenant } from "./middleware/tenant";
import { authenticateToken } from "./middleware/auth";
import {
  insertWorkTaskSchema, insertWorkStationSchema, insertShiftSchema,
  insertChecklistSchema
} from "@shared/schema";

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

  // === GLOBAL MIDDLEWARE ===
  // Tenant resolution middleware for protected routes only
  app.use('/api/modules', resolveTenant);

  // === MODULE ROUTES ===
  // Checklist module - protected and tenant-scoped
  app.use('/api/modules/checklists', checklistRoutes);

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
          subdomain: req.tenant.subdomain,
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
  
  // Work Tasks
  app.get('/api/work-tasks', authenticateToken, async (req, res) => {
    try {
      const workTasks = await storage.getWorkTasks(req.tenantId!);
      res.json(workTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work tasks" });
    }
  });

  app.post('/api/work-tasks', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertWorkTaskSchema.parse(req.body);
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

  app.patch('/api/work-tasks/:id', authenticateToken, async (req, res) => {
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

  app.delete('/api/work-tasks/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkTask(id, req.tenantId!);
      res.status(200).json({ message: "Work task deleted" });
    } catch (error) {
      console.error('Delete work task error:', error);
      res.status(500).json({ message: "Failed to delete work task" });
    }
  });

  // Work Stations  
  app.get('/api/work-stations', authenticateToken, async (req, res) => {
    try {
      const workTaskId = req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined;
      const workStations = await storage.getWorkStations(req.tenantId!, workTaskId);
      res.json(workStations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work stations" });
    }
  });

  app.post('/api/work-stations', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertWorkStationSchema.parse(req.body);
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

  app.patch('/api/work-stations/:id', authenticateToken, async (req, res) => {
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

  app.delete('/api/work-stations/:id', authenticateToken, async (req, res) => {
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
      const validatedData = insertShiftSchema.parse(req.body);
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
  app.get('/api/checklists', authenticateToken, async (req, res) => {
    try {
      const checklists = await storage.getChecklists(req.tenantId!);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklists" });
    }
  });

  app.get('/api/checklists/active', authenticateToken, async (req, res) => {
    try {
      const checklists = await storage.getActiveChecklists(req.tenantId!);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active checklists" });
    }
  });

  app.post('/api/checklists', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertChecklistSchema.parse(req.body);
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

  app.use('/api/dashboard*', (req, res, next) => {
    const newPath = req.path.replace('/api/dashboard', '/api/modules/checklists/dashboard');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}