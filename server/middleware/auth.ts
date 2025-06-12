import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '@shared/schema';

// JWT Secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request to include user and tenant info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: number;
    }
  }
}

/**
 * MIDDLEWARE: JWT Authentication
 * Verifies JWT token and attaches user info to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'Access token required',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Validate required fields in JWT payload
    if (!decoded.userId || !decoded.tenantId || !decoded.role) {
      return res.status(403).json({ 
        message: 'Invalid token payload',
        error: 'INVALID_TOKEN_PAYLOAD'
      });
    }
    
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(403).json({ 
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN'
    });
  }
};

/**
 * MIDDLEWARE: Role-based authorization
 * Checks if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * MIDDLEWARE: Superadmin only
 */
export const requireSuperAdmin = requireRole(['superadmin']);

/**
 * MIDDLEWARE: Admin or higher
 */
export const requireAdmin = requireRole(['superadmin', 'admin']);

/**
 * MIDDLEWARE: Module access control
 * Checks if tenant has access to specific module
 */
export const requireModule = (moduleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Import storage here to avoid circular dependencies
    const { storage } = await import('../storage');
    
    try {
      const tenant = await storage.getTenant(req.user.tenantId);
      if (!tenant || !tenant.modules.includes(moduleName)) {
        return res.status(403).json({ 
          message: `Module '${moduleName}' not enabled for this tenant`,
          error: 'MODULE_ACCESS_DENIED'
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({ 
        message: 'Error checking module access',
        error: 'MODULE_CHECK_FAILED'
      });
    }
  };
};

/**
 * MIDDLEWARE: Resource ownership validation
 * Ensures user can only access resources belonging to their tenant
 */
export const validateTenantOwnership = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.tenantId) {
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  // For resource-specific endpoints (e.g., /api/items/:id), validate ownership
  const resourceId = req.params.id;
  if (resourceId && req.method !== 'POST') {
    try {
      // Import storage here to avoid circular dependencies
      const { storage } = await import('../storage');
      
      // Extract resource type from URL path
      const pathSegments = req.path.split('/');
      const resourceType = pathSegments[pathSegments.length - 2]; // e.g., 'checklists', 'categories', etc.
      
      // Validate resource belongs to the user's tenant
      let resource;
      const id = parseInt(resourceId);
      
      switch (resourceType) {
        case 'checklists':
          resource = await storage.getChecklist(id, req.tenantId);
          break;
        case 'categories':
          resource = await storage.getCategory(id, req.tenantId);
          break;
        case 'questions':
          resource = await storage.getQuestion(id, req.tenantId);
          break;
        case 'work-tasks':
          resource = await storage.getWorkTask(id, req.tenantId);
          break;
        case 'work-stations':
          resource = await storage.getWorkStation(id, req.tenantId);
          break;
        case 'shifts':
          resource = await storage.getShift(id, req.tenantId);
          break;
        default:
          // For unknown resource types, continue without validation
          return next();
      }
      
      if (!resource) {
        return res.status(404).json({ 
          message: 'Resource not found or access denied',
          error: 'RESOURCE_NOT_FOUND'
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        message: 'Error validating resource ownership',
        error: 'OWNERSHIP_VALIDATION_FAILED'
      });
    }
  }
  
  next();
};

/**
 * MIDDLEWARE: Strict tenant isolation
 * Prevents any cross-tenant data access by overriding tenantId in request body
 */
export const enforceTenantIsolation = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.tenantId) {
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  // For POST/PATCH requests, ensure tenantId cannot be overridden
  if (req.method === 'POST' || req.method === 'PATCH') {
    if (req.body && typeof req.body === 'object') {
      // Remove any tenantId from request body and set it to authenticated user's tenant
      delete req.body.tenantId;
      
      // For security, also remove any id field in POST requests to prevent ID collision attacks
      if (req.method === 'POST') {
        delete req.body.id;
      }
    }
  }
  
  next();
};

/**
 * Utility: Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Utility: Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
};

/**
 * Utility: Compare password
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
};