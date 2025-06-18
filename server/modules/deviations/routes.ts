/**
 * DEVIATIONS MODULE ROUTES
 * 
 * Handles deviations - issues that need to be addressed and corrected
 * based on checklist responses or other quality/safety issues.
 */

import type { Express, Request } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { 
  authenticateToken, 
  requireModule, 
  validateTenantOwnership, 
  enforceTenantIsolation 
} from "../../middleware/auth";

// Define AuthenticatedRequest type locally
interface AuthenticatedRequest extends Request {
  user?: any;
  tenantId?: number;
  tenant?: any;
}
import { insertDeviationTypeSchema, insertDeviationSchema, insertDeviationCommentSchema } from "@shared/schema";

export default function deviationRoutes(app: Express) {
  


  // === GET /api/deviations - List deviations ===
  app.get('/api/deviations', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        
        // Parse query parameters
        const filters = {
          status: req.query.status as string | undefined,
          priority: req.query.priority as string | undefined,
          assignedToUserId: req.query.assignedToUserId ? parseInt(req.query.assignedToUserId as string) : undefined,
          createdByUserId: req.query.createdByUserId ? parseInt(req.query.createdByUserId as string) : undefined,
          workTaskId: req.query.workTaskId ? parseInt(req.query.workTaskId as string) : undefined,
          locationId: req.query.locationId ? parseInt(req.query.locationId as string) : undefined,
          deviationTypeId: req.query.deviationTypeId ? parseInt(req.query.deviationTypeId as string) : undefined,
          search: req.query.search as string | undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };
        
        const deviations = await storage.getDeviations(tenantId, filters);
        res.json(deviations);
        
      } catch (error) {
        console.error('Error fetching deviations:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === GET /api/deviations/stats - Get deviation statistics ===
  app.get('/api/deviations/stats', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const stats = await storage.getDeviationStats(tenantId);
        res.json(stats);
        
      } catch (error) {
        console.error('Error fetching deviation stats:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === GET /api/deviations/:id - Get single deviation ===
  app.get('/api/deviations/:id', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);
        
        if (isNaN(deviationId)) {
          return res.status(400).json({ message: 'Invalid deviation ID' });
        }
        
        const deviation = await storage.getDeviation(deviationId, tenantId);
        
        if (!deviation) {
          return res.status(404).json({ message: 'Deviation not found' });
        }
        
        res.json(deviation);
        
      } catch (error) {
        console.error('Error fetching deviation:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === POST /api/deviations - Create deviation ===
  app.post('/api/deviations', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const userId = req.user!.userId;
        
        // Get default status for the tenant
        const defaultStatus = await storage.getDefaultDeviationStatus(tenantId);
        
        const validatedData = insertDeviationSchema.parse({
          ...req.body,
          tenantId,
          createdByUserId: userId,
          statusId: defaultStatus?.id, // Set to default status
        });
        
        const deviation = await storage.createDeviation(validatedData);
        res.status(201).json(deviation);
        
      } catch (error) {
        console.error('Error creating deviation:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === PATCH /api/deviations/:id - Update deviation ===
  app.patch('/api/deviations/:id', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);
        
        if (isNaN(deviationId)) {
          return res.status(400).json({ message: 'Invalid deviation ID' });
        }
        
        // Parse the update data (allow partial updates)
        const updateData = req.body;
        delete updateData.id; // Don't allow updating ID
        delete updateData.tenantId; // Don't allow updating tenant
        delete updateData.createdAt; // Don't allow updating creation time
        delete updateData.createdByUserId; // Don't allow changing creator
        
        const updatedDeviation = await storage.updateDeviation(deviationId, updateData, tenantId);
        res.json(updatedDeviation);
        
      } catch (error) {
        console.error('Error updating deviation:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === DELETE /api/deviations/:id - Delete deviation ===
  app.delete('/api/deviations/:id', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);
        
        if (isNaN(deviationId)) {
          return res.status(400).json({ message: 'Invalid deviation ID' });
        }
        
        await storage.deleteDeviation(deviationId, tenantId);
        res.status(204).send();
        
      } catch (error) {
        console.error('Error deleting deviation:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === GET /api/deviations/:id/comments - Get deviation comments ===
  app.get('/api/deviations/:id/comments', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);
        
        if (isNaN(deviationId)) {
          return res.status(400).json({ message: 'Invalid deviation ID' });
        }
        
        const comments = await storage.getDeviationComments(deviationId, tenantId);
        res.json(comments);
        
      } catch (error) {
        if (error instanceof Error && error.message === 'Deviation not found') {
          return res.status(404).json({ message: 'Deviation not found' });
        }
        console.error('Error fetching deviation comments:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === POST /api/deviations/:id/comments - Create deviation comment ===
  app.post('/api/deviations/:id/comments', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const userId = req.user!.userId;
        const deviationId = parseInt(req.params.id);
        
        if (isNaN(deviationId)) {
          return res.status(400).json({ message: 'Invalid deviation ID' });
        }
        
        // Verify deviation exists and belongs to tenant
        const deviation = await storage.getDeviation(deviationId, tenantId);
        if (!deviation) {
          return res.status(404).json({ message: 'Deviation not found' });
        }
        
        const validatedData = insertDeviationCommentSchema.parse({
          ...req.body,
          deviationId,
          userId,
        });
        
        const comment = await storage.createDeviationComment(validatedData);
        res.status(201).json(comment);
        
      } catch (error) {
        console.error('Error creating deviation comment:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // === DELETE /api/deviations/:id/comments/:commentId - Delete deviation comment ===
  app.delete('/api/deviations/:id/comments/:commentId', 
    authenticateToken, 
    requireModule('deviations'), 
    validateTenantOwnership, 
    enforceTenantIsolation, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const commentId = parseInt(req.params.commentId);
        
        if (isNaN(commentId)) {
          return res.status(400).json({ message: 'Invalid comment ID' });
        }
        
        await storage.deleteDeviationComment(commentId, tenantId);
        res.status(204).send();
        
      } catch (error) {
        if (error instanceof Error && (
          error.message === 'Comment not found' || 
          error.message === 'Deviation not found'
        )) {
          return res.status(404).json({ message: error.message });
        }
        console.error('Error deleting deviation comment:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );



  return app;
}