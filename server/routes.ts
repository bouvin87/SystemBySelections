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
import { emailService } from "./email";
import {
  insertWorkTaskSchema, insertWorkStationSchema, insertShiftSchema,
  insertChecklistSchema, insertCategorySchema, insertQuestionSchema,
  insertUserSchema, insertChecklistResponseSchema, insertDeviationTypeSchema,
  insertCustomFieldSchema, insertCustomFieldTypeMappingSchema
} from "@shared/schema";
import { uploadMultiple } from "./middleware/upload";
import path from "path";
import fs from "fs";

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

  // === DEVIATION SETTINGS ROUTES ===
  
  // GET /api/deviations/settings - Get deviation settings
  app.get('/api/deviations/settings', 
    authenticateToken, 
    requireModule('deviations'), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const settings = await storage.getDeviationSettings(tenantId);
        res.json(settings || { showCreateButtonInMenu: false });
        
      } catch (error) {
        console.error('Error fetching deviation settings:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/deviations/settings - Update deviation settings
  app.patch('/api/deviations/settings', 
    authenticateToken, 
    requireModule('deviations'), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const settings = await storage.updateDeviationSettings(tenantId, req.body);
        res.json(settings);
        
      } catch (error) {
        console.error('Error updating deviation settings:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // Deviation Priorities API (must be before deviationRoutes to avoid conflicts)
  app.get('/api/deviations/priorities', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const priorities = await storage.getDeviationPriorities(req.tenantId);
      res.json(priorities);
    } catch (error) {
      console.error('Error fetching deviation priorities:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deviations/priorities', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const priority = await storage.createDeviationPriority({
        ...req.body,
        tenantId: req.tenantId,
      });
      res.status(201).json(priority);
    } catch (error) {
      console.error('Error creating deviation priority:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/deviations/priorities/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const id = parseInt(req.params.id);
      const priority = await storage.updateDeviationPriority(id, req.body, req.tenantId);
      res.json(priority);
    } catch (error) {
      console.error('Error updating deviation priority:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/deviations/priorities/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const id = parseInt(req.params.id);
      await storage.deleteDeviationPriority(id, req.tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting deviation priority:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Deviation Statuses API
  app.get('/api/deviations/statuses', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const statuses = await storage.getDeviationStatuses(req.tenantId);
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching deviation statuses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deviations/statuses', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const status = await storage.createDeviationStatus({
        ...req.body,
        tenantId: req.tenantId,
      });
      res.status(201).json(status);
    } catch (error) {
      console.error('Error creating deviation status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/deviations/statuses/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const id = parseInt(req.params.id);
      const status = await storage.updateDeviationStatus(id, req.body, req.tenantId);
      res.json(status);
    } catch (error) {
      console.error('Error updating deviation status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/deviations/statuses/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const id = parseInt(req.params.id);
      await storage.deleteDeviationStatus(id, req.tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting deviation status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Deviations module - protected and tenant-scoped  
  deviationRoutes(app);

  // === USER MANAGEMENT ROUTES ===
  // Get all users for the tenant (admin only)
  // Deviation Comments API
  app.get('/api/deviations/:id/comments', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const deviationId = parseInt(req.params.id);
      if (isNaN(deviationId)) {
        return res.status(400).json({ message: 'Invalid deviation ID' });
      }
      const comments = await storage.getDeviationComments(deviationId, req.tenantId);
      res.json(comments);
    } catch (error) {
      if (error instanceof Error && error.message === 'Deviation not found') {
        return res.status(404).json({ message: 'Deviation not found' });
      }
      console.error('Error fetching deviation comments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deviations/:id/comments', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId || !req.user?.id) {
        return res.status(403).json({ message: 'Tenant ID and user required' });
      }
      const deviationId = parseInt(req.params.id);
      if (isNaN(deviationId)) {
        return res.status(400).json({ message: 'Invalid deviation ID' });
      }
      
      // Verify deviation exists and belongs to tenant
      const deviation = await storage.getDeviation(deviationId, req.tenantId);
      if (!deviation) {
        return res.status(404).json({ message: 'Deviation not found' });
      }

      const comment = await storage.createDeviationComment({
        deviationId,
        userId: req.user.id,
        comment: req.body.comment,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating deviation comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Deviation Logs API
  app.get('/api/deviations/:id/logs', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const deviationId = parseInt(req.params.id);
      if (isNaN(deviationId)) {
        return res.status(400).json({ message: 'Invalid deviation ID' });
      }
      const logs = await storage.getDeviationLogs(deviationId, req.tenantId);
      res.json(logs);
    } catch (error) {
      if (error instanceof Error && error.message === 'Deviation not found') {
        return res.status(404).json({ message: 'Deviation not found' });
      }
      console.error('Error fetching deviation logs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Allow any authenticated user to view users (needed for deviation assignments and comments)
      // if (req.user?.role !== 'admin') {
      //   return res.status(403).json({ message: 'Admin access required' });
      // }

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

  // === CUSTOM FIELDS API ===
  // Get all custom fields for a tenant
  app.get('/api/custom-fields', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const fields = await storage.getCustomFields(req.tenantId);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create a new custom field
  app.post('/api/custom-fields', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      
      // Only admin users can create custom fields
      if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const validatedData = insertCustomFieldSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      const field = await storage.createCustomField(validatedData);
      res.status(201).json(field);
    } catch (error) {
      console.error('Error creating custom field:', error);
      res.status(400).json({ message: 'Invalid custom field data' });
    }
  });

  // Update a custom field
  app.patch('/api/custom-fields/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      
      // Only admin users can update custom fields
      if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const id = parseInt(req.params.id);
      const validatedData = insertCustomFieldSchema.partial().parse(req.body);
      
      const field = await storage.updateCustomField(id, validatedData, req.tenantId);
      res.json(field);
    } catch (error) {
      console.error('Error updating custom field:', error);
      res.status(400).json({ message: 'Invalid custom field data' });
    }
  });

  // Delete a custom field
  app.delete('/api/custom-fields/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      
      // Only admin users can delete custom fields
      if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const id = parseInt(req.params.id);
      await storage.deleteCustomField(id, req.tenantId);
      res.status(200).json({ message: 'Custom field deleted' });
    } catch (error) {
      console.error('Error deleting custom field:', error);
      res.status(500).json({ message: 'Failed to delete custom field' });
    }
  });

  // Get custom fields for a specific deviation type
  app.get('/api/deviation-types/:id/custom-fields', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }

      const deviationTypeId = parseInt(req.params.id);
      const fields = await storage.getCustomFieldsForDeviationType(deviationTypeId, req.tenantId);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching custom fields for deviation type:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Link a custom field to a deviation type
  app.post('/api/custom-fields/:fieldId/deviation-types/:typeId', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      
      // Only admin users can manage field mappings
      if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const customFieldId = parseInt(req.params.fieldId);
      const deviationTypeId = parseInt(req.params.typeId);

      // Verify both field and type belong to the tenant
      const field = await storage.getCustomField(customFieldId, req.tenantId);
      if (!field) {
        return res.status(404).json({ message: 'Custom field not found' });
      }

      const mapping = await storage.createCustomFieldTypeMapping({
        customFieldId,
        deviationTypeId
      });
      
      res.status(201).json(mapping);
    } catch (error) {
      console.error('Error creating custom field mapping:', error);
      res.status(400).json({ message: 'Failed to create mapping' });
    }
  });

  // Remove link between custom field and deviation type
  app.delete('/api/custom-fields/:fieldId/deviation-types/:typeId', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      
      // Only admin users can manage field mappings
      if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const customFieldId = parseInt(req.params.fieldId);
      const deviationTypeId = parseInt(req.params.typeId);

      await storage.deleteCustomFieldTypeMapping(customFieldId, deviationTypeId);
      res.status(200).json({ message: 'Mapping removed' });
    } catch (error) {
      console.error('Error removing custom field mapping:', error);
      res.status(500).json({ message: 'Failed to remove mapping' });
    }
  });

  // Get deviation types linked to a custom field
  app.get('/api/custom-fields/:id/deviation-types', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }

      const customFieldId = parseInt(req.params.id);
      const types = await storage.getDeviationTypesForCustomField(customFieldId, req.tenantId);
      res.json(types);
    } catch (error) {
      console.error('Error fetching deviation types for custom field:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get custom field values for a deviation
  app.get('/api/deviations/:id/custom-field-values', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }

      const deviationId = parseInt(req.params.id);
      const values = await storage.getCustomFieldValues(deviationId, req.tenantId);
      res.json(values);
    } catch (error) {
      console.error('Error fetching custom field values:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Set custom field value for a deviation
  app.post('/api/deviations/:id/custom-field-values', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }

      const deviationId = parseInt(req.params.id);
      const { customFieldId, value } = req.body;

      // Verify deviation exists and belongs to tenant
      const deviation = await storage.getDeviation(deviationId, req.tenantId);
      if (!deviation) {
        return res.status(404).json({ message: 'Deviation not found' });
      }

      const fieldValue = await storage.setCustomFieldValue({
        deviationId,
        customFieldId,
        value
      });

      res.json(fieldValue);
    } catch (error) {
      console.error('Error setting custom field value:', error);
      res.status(400).json({ message: 'Failed to set custom field value' });
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

  // Departments
  app.get("/api/departments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const departments = await storage.getDepartments(tenantId);
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/departments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const departmentData = { ...req.body, tenantId };
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/departments/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const departmentId = parseInt(req.params.id);
      const department = await storage.updateDepartment(departmentId, req.body, tenantId);
      res.json(department);
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/departments/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const departmentId = parseInt(req.params.id);
      await storage.deleteDepartment(departmentId, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ message: "Internal server error" });
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



  // Test email configuration
  app.get('/api/email/test', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await emailService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('Error testing email:', error);
      res.status(500).json({ success: false, message: 'Email test failed' });
    }
  });

  // Deviation Attachments API
  app.get('/api/deviations/:id/attachments', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const deviationId = parseInt(req.params.id);
      const attachments = await storage.getDeviationAttachments(deviationId, req.tenantId);
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching deviation attachments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deviations/:id/attachments', authenticateToken, requireModule('deviations'), uploadMultiple, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId || !req.user) {
        return res.status(403).json({ message: 'Authentication required' });
      }
      
      const deviationId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const attachments = [];
      for (const file of files) {
        const attachment = await storage.createDeviationAttachment({
          deviationId,
          userId: req.user.userId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          filePath: file.path
        });
        attachments.push(attachment);
      }

      res.status(201).json(attachments);
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  });

  app.delete('/api/deviations/attachments/:id', authenticateToken, requireModule('deviations'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(403).json({ message: 'Tenant ID required' });
      }
      const attachmentId = parseInt(req.params.id);
      await storage.deleteDeviationAttachment(attachmentId, req.tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting deviation attachment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // === SYSTEM ANNOUNCEMENTS ===
  app.get('/api/system/announcements', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const announcements = await storage.getSystemAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching system announcements:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/system/announcements', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: 'Authentication required' });
      }
      
      // Only superadmin can create system announcements
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Requires superadmin role' });
      }

      const { message, isActive } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: 'Message is required' });
      }

      // If creating an active announcement, deactivate all other active announcements
      if (isActive) {
        const existingAnnouncements = await storage.getSystemAnnouncements();
        for (const announcement of existingAnnouncements) {
          if (announcement.isActive) {
            await storage.updateSystemAnnouncement(announcement.id, { isActive: false });
          }
        }
      }

      const newAnnouncement = await storage.createSystemAnnouncement({
        message,
        isActive: isActive || false,
        createdBy: req.user.userId,
        updatedBy: req.user.userId
      });

      res.status(201).json(newAnnouncement);
    } catch (error) {
      console.error('Error creating system announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/system/announcements/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: 'Authentication required' });
      }
      
      // Only superadmin can update system announcements
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Requires superadmin role' });
      }

      const id = parseInt(req.params.id);
      const { message, isActive } = req.body;
      
      // If activating this announcement, deactivate all other active announcements
      if (isActive) {
        const existingAnnouncements = await storage.getSystemAnnouncements();
        for (const announcement of existingAnnouncements) {
          if (announcement.isActive && announcement.id !== id) {
            await storage.updateSystemAnnouncement(announcement.id, { isActive: false });
          }
        }
      }

      const updatedAnnouncement = await storage.updateSystemAnnouncement(id, {
        ...(message && { message }),
        ...(typeof isActive === 'boolean' && { isActive }),
        updatedBy: req.user.userId
      });

      res.json(updatedAnnouncement);
    } catch (error) {
      console.error('Error updating system announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/system/announcements/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: 'Authentication required' });
      }
      
      // Only superadmin can delete system announcements
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Requires superadmin role' });
      }

      const id = parseInt(req.params.id);
      await storage.deleteSystemAnnouncement(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting system announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get active system announcement for user login notification
  app.get('/api/system/announcements/active', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const announcement = await storage.getActiveSystemAnnouncement();
      res.json(announcement);
    } catch (error) {
      console.error('Error fetching active system announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Serve uploaded files (no authentication required for file access)
  app.get('/api/files/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'deviations', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set appropriate headers for file serving
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      res.setHeader('Content-Type', `image/${ext.slice(1)}`);
    }
    
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}