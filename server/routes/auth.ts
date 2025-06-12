import express from 'express';
import { loginSchema, insertUserSchema, insertTenantSchema } from '@shared/schema';
import { storage } from '../storage';
import { generateToken, hashPassword, comparePassword } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * AUTH ROUTES: Core authentication endpoints
 */

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Extract tenant info from subdomain or header
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (!subdomain || subdomain === 'localhost') {
      return res.status(400).json({ message: 'Invalid subdomain' });
    }

    const tenant = await storage.getTenantBySubdomain(subdomain);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const user = await storage.getUserByEmail(email, tenant.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        modules: tenant.modules,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Register endpoint (for creating users within a tenant)
router.post('/register', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Extract tenant info
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (!subdomain || subdomain === 'localhost') {
      return res.status(400).json({ message: 'Invalid subdomain' });
    }

    const tenant = await storage.getTenantBySubdomain(subdomain);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email, tenant.id);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(userData.hashedPassword);
    const newUser = await storage.createUser({
      ...userData,
      tenantId: tenant.id,
      hashedPassword,
      role: userData.role || 'user',
    });

    const token = generateToken({
      userId: newUser.id,
      tenantId: tenant.id,
      role: newUser.role,
      email: newUser.email,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        modules: tenant.modules,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * SUPERADMIN ROUTES: Tenant management (only for superadmin)
 */

// Create new tenant (superadmin only)
router.post('/tenants', requireSuperAdmin, async (req, res) => {
  try {
    const tenantData = insertTenantSchema.parse(req.body);
    
    // Check if subdomain already exists
    const existingTenant = await storage.getTenantBySubdomain(tenantData.subdomain);
    if (existingTenant) {
      return res.status(409).json({ message: 'Subdomain already exists' });
    }

    const tenant = await storage.createTenant(tenantData);
    res.status(201).json(tenant);
  } catch (error) {
    console.error('Tenant creation error:', error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

// Get all tenants (superadmin only)
router.get('/tenants', requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await storage.getTenants();
    res.json(tenants);
  } catch (error) {
    console.error('Fetch tenants error:', error);
    res.status(500).json({ message: 'Failed to fetch tenants' });
  }
});

export default router;