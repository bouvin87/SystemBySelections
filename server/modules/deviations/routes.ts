import { Router } from 'express';
import { storage } from '../../storage';
import { insertActionItemSchema, insertActionCommentSchema } from '@shared/schema';
import { authenticateToken, enforceTenantIsolation } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticateToken);
router.use(enforceTenantIsolation);

// GET /api/actions - List action items with filters
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Parse query parameters for filtering
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      assignedToUserId: req.query.assignedToUserId ? parseInt(req.query.assignedToUserId) : undefined,
      createdByUserId: req.query.createdByUserId ? parseInt(req.query.createdByUserId) : undefined,
      workTaskId: req.query.workTaskId ? parseInt(req.query.workTaskId) : undefined,
      locationId: req.query.locationId ? parseInt(req.query.locationId) : undefined,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]
    );

    const actionItems = await storage.getActionItems(tenantId, filters);
    res.json(actionItems);
  } catch (error) {
    console.error('Error fetching action items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/actions/stats - Get action statistics
router.get('/stats', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const stats = await storage.getActionStats(tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching action stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/actions/:id - Get specific action item
router.get('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid action item ID' });
    }

    const actionItem = await storage.getActionItem(id, tenantId);
    
    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    res.json(actionItem);
  } catch (error) {
    console.error('Error fetching action item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/actions - Create new action item
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.id;

    // Validate request body
    const validationResult = insertActionItemSchema.safeParse({
      ...req.body,
      tenantId,
      createdByUserId: userId,
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
    }

    const actionItem = await storage.createActionItem(validationResult.data);
    res.status(201).json(actionItem);
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/actions/:id - Update action item
router.patch('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid action item ID' });
    }

    // Validate request body (partial update)
    const updateSchema = insertActionItemSchema.partial().omit({ tenantId: true, createdByUserId: true });
    const validationResult = updateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
    }

    const actionItem = await storage.updateActionItem(id, validationResult.data, tenantId);
    res.json(actionItem);
  } catch (error) {
    if (error instanceof Error && error.message === 'Action item not found') {
      return res.status(404).json({ message: 'Action item not found' });
    }
    console.error('Error updating action item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/actions/:id - Delete action item
router.delete('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid action item ID' });
    }

    await storage.deleteActionItem(id, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting action item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/actions/:id/comments - Get comments for action item
router.get('/:id/comments', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const actionItemId = parseInt(req.params.id);
    
    if (isNaN(actionItemId)) {
      return res.status(400).json({ message: 'Invalid action item ID' });
    }

    const comments = await storage.getActionComments(actionItemId, tenantId);
    res.json(comments);
  } catch (error) {
    if (error instanceof Error && error.message === 'Action item not found') {
      return res.status(404).json({ message: 'Action item not found' });
    }
    console.error('Error fetching action comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/actions/:id/comments - Add comment to action item
router.post('/:id/comments', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const actionItemId = parseInt(req.params.id);
    
    if (isNaN(actionItemId)) {
      return res.status(400).json({ message: 'Invalid action item ID' });
    }

    // Verify action item exists and belongs to tenant
    const actionItem = await storage.getActionItem(actionItemId, tenantId);
    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    // Validate comment data
    const validationResult = insertActionCommentSchema.safeParse({
      actionItemId,
      userId,
      comment: req.body.comment,
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
    }

    const comment = await storage.createActionComment(validationResult.data);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating action comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/actions/comments/:commentId - Delete comment
router.delete('/comments/:commentId', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const commentId = parseInt(req.params.commentId);
    
    if (isNaN(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    await storage.deleteActionComment(commentId, tenantId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && (
      error.message === 'Comment not found' || 
      error.message === 'Action item not found'
    )) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error deleting action comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  return app;
}