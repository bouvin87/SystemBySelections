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
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
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
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Import storage here to avoid circular dependencies
    const { storage } = await import('../storage');
    
    try {
      const tenant = await storage.getTenant(req.user.tenantId);
      if (!tenant || !tenant.modules.includes(moduleName)) {
        return res.status(403).json({ message: `Module '${moduleName}' not enabled for this tenant` });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error checking module access' });
    }
  };
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