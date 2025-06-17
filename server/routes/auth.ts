import express from 'express';
import { loginSchema, insertUserSchema, insertTenantSchema } from '@shared/schema';
import { storage } from '../storage';
import { generateToken, hashPassword, comparePassword, requireSuperAdmin } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple authentication middleware for this route file
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const router = express.Router();

/**
 * AUTH ROUTES: Core authentication endpoints
 */

// Get current user endpoint
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userData = await storage.getUser(user.userId);
    
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle superadmin users without tenant
    if (user.role === 'superadmin') {
      return res.json({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
        },
        tenant: null,
      });
    }

    // Get tenant for regular users
    const tenant = await storage.getTenant(user.tenantId!);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        modules: tenant.modules,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Get available tenants for an email
router.post('/tenants', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const users = await storage.getUsersByEmail(email);
    const activeUsers = users.filter(u => u.isActive);
    
    if (activeUsers.length === 0) {
      return res.status(404).json({ message: 'No accounts found for this email' });
    }

    const tenants = [];
    for (const user of activeUsers) {
      if (user.tenantId) {
        const tenant = await storage.getTenant(user.tenantId);
        if (tenant) {
          tenants.push({
            id: tenant.id,
            name: tenant.name,
            modules: tenant.modules,
            userRole: user.role.trim(),
          });
        }
      }
    }

    res.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint with multi-tenant support
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // If tenantId is provided, login to specific tenant
    if (tenantId) {
      const user = await storage.getUserByEmail(email, tenantId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await comparePassword(password, user.hashedPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      const token = generateToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role.trim(),
        email: user.email,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.trim(),
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          modules: tenant.modules,
        },
      });
    }

    // Find all users with this email
    const users = await storage.getUsersByEmail(email);
    const activeUsers = users.filter(u => u.isActive);
    
    if (activeUsers.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password using first user (all should have same password)
    const firstUser = activeUsers[0];
    const isPasswordValid = await comparePassword(password, firstUser.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Handle superadmin users without tenant
    const superadminUser = activeUsers.find(u => u.role.trim() === 'superadmin');
    if (superadminUser) {
      const token = generateToken({
        userId: superadminUser.id,
        role: superadminUser.role.trim(),
        email: superadminUser.email,
      });

      return res.json({
        token,
        user: {
          id: superadminUser.id,
          email: superadminUser.email,
          firstName: superadminUser.firstName,
          lastName: superadminUser.lastName,
          role: superadminUser.role.trim(),
        },
        tenant: null,
      });
    }

    // Filter tenant users
    const tenantUsers = activeUsers.filter(u => u.tenantId);
    
    // If user has multiple tenants, require tenant selection
    if (tenantUsers.length > 1) {
      return res.status(200).json({ 
        requireTenantSelection: true,
        message: 'Multiple tenants available, please select one' 
      });
    }

    // Single tenant login
    if (tenantUsers.length === 1) {
      const user = tenantUsers[0];
      const tenant = await storage.getTenant(user.tenantId!);
      if (!tenant) {
        return res.status(401).json({ message: 'Tenant not found for user' });
      }

      const token = generateToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role.trim(),
        email: user.email,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.trim(),
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          modules: tenant.modules,
        },
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user info (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.userId);
    const tenant = await storage.getTenant(req.user!.tenantId);
    
    if (!user || !tenant) {
      return res.status(404).json({ message: 'User or tenant not found' });
    }

    res.json({
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
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// Register endpoint (for creating users within a tenant)
router.post('/register', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Extract tenant info from subdomain or use default for development
    const host = req.get('host') || '';
    let subdomain = host.split('.')[0];
    
    // For development/replit environment, default to 'demo' tenant
    if (!subdomain || subdomain === 'localhost' || host.includes('replit.dev') || host.includes('replit.app')) {
      subdomain = 'demo';
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

// Switch tenant for user (requires re-authentication)
router.post('/switch-tenant', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.body;
    const currentUserId = req.user!.userId;
    const currentEmail = req.user!.email;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Verify user has access to this tenant
    const user = await storage.getUserByEmail(currentEmail, tenantId);
    if (!user || !user.isActive || user.id !== currentUserId) {
      return res.status(403).json({ message: 'Access denied to this tenant' });
    }

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Generate new token for the selected tenant
    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role.trim(),
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.trim(),
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        modules: tenant.modules,
      },
    });
  } catch (error) {
    console.error('Switch tenant error:', error);
    res.status(500).json({ message: 'Failed to switch tenant' });
  }
});

export default router;