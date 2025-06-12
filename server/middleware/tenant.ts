import { Request, Response, NextFunction } from 'express';

/**
 * MIDDLEWARE: Tenant Resolution
 * Extracts tenant information from subdomain and attaches to request
 */
export const resolveTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);
    
    if (!subdomain) {
      return res.status(400).json({ message: 'Invalid subdomain' });
    }

    // Import storage here to avoid circular dependencies
    const { storage } = await import('../storage');
    
    const tenant = await storage.getTenantBySubdomain(subdomain);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Attach tenant info to request
    req.tenantId = tenant.id;
    req.tenant = tenant;
    
    next();
  } catch (error) {
    console.error('Error resolving tenant:', error);
    return res.status(500).json({ message: 'Error resolving tenant' });
  }
};

/**
 * Extract subdomain from host header
 * Examples:
 * - company1.localhost:3000 -> company1
 * - company1.myapp.com -> company1
 * - localhost:3000 -> null (no subdomain)
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0];
  
  // Split by dots
  const parts = hostWithoutPort.split('.');
  
  // If only one part (e.g., localhost), no subdomain
  if (parts.length < 2) {
    return null;
  }
  
  // Return first part as subdomain
  return parts[0];
}

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      tenant?: import('@shared/schema').Tenant;
    }
  }
}