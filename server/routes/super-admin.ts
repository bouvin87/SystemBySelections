import { Router } from 'express';
import { storage } from '../storage';
import { insertTenantSchema, insertUserSchema } from '@shared/schema';
import { authenticateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// Middleware to check superadmin role
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Requires superadmin role' });
  }
  next();
};

// Get all tenants (superadmin only)
router.get('/tenants', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await storage.getTenants();
    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Failed to fetch tenants' });
  }
});

// Create new tenant (superadmin only)
router.post('/tenants', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantData = insertTenantSchema.parse(req.body);
    const tenant = await storage.createTenant(tenantData);
    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

// Update tenant (superadmin only)
router.patch('/tenants/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tenantData = insertTenantSchema.partial().parse(req.body);
    
    const tenant = await storage.updateTenant(id, tenantData);
    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Failed to update tenant' });
  }
});

// Delete tenant (superadmin only)
router.delete('/tenants/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteTenant(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Failed to delete tenant' });
  }
});

// Get users for a specific tenant (superadmin only)
router.get('/users/:tenantId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const users = await storage.getUsers(tenantId);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create new user for a tenant (superadmin only)
router.post('/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with hashed password
    const userToCreate = {
      ...userData,
      password: hashedPassword,
    };
    
    const user = await storage.createUser(userToCreate);
    
    // Remove password from response
    const { hashedPassword: _, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

export default router;