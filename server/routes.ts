import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import checklistRoutes from "./modules/checklists/routes";
import { resolveTenant } from "./middleware/tenant";

/**
 * MULTI-TENANT SAAS ROUTE REGISTRATION
 * 
 * Architecture:
 * - /api/auth/* - Authentication endpoints (login, register, tenant management)
 * - /api/modules/checklists/* - Checklist module routes (tenant-scoped)
 * - All routes are tenant-aware and use JWT authentication
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  // === GLOBAL MIDDLEWARE ===
  // Tenant resolution middleware (extracts tenant from subdomain)
  app.use('/api', resolveTenant);

  // === AUTHENTICATION ROUTES ===
  // Public routes for login, register, and tenant management
  app.use('/api/auth', authRoutes);

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
  // These routes provide backward compatibility with the old API structure
  // while redirecting to the new modular endpoints

  // Legacy checklist routes - redirect to module routes
  app.use('/api/checklists*', (req, res, next) => {
    // Redirect old checklist API calls to new module structure
    const newPath = req.path.replace('/api/checklists', '/api/modules/checklists/checklists');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/work-tasks*', (req, res, next) => {
    const newPath = req.path.replace('/api/work-tasks', '/api/modules/checklists/work-tasks');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/work-stations*', (req, res, next) => {
    const newPath = req.path.replace('/api/work-stations', '/api/modules/checklists/work-stations');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/shifts*', (req, res, next) => {
    const newPath = req.path.replace('/api/shifts', '/api/modules/checklists/shifts');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/categories*', (req, res, next) => {
    const newPath = req.path.replace('/api/categories', '/api/modules/checklists/categories');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/questions*', (req, res, next) => {
    const newPath = req.path.replace('/api/questions', '/api/modules/checklists/questions');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/responses*', (req, res, next) => {
    const newPath = req.path.replace('/api/responses', '/api/modules/checklists/responses');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  app.use('/api/dashboard*', (req, res, next) => {
    const newPath = req.path.replace('/api/dashboard', '/api/modules/checklists/dashboard');
    req.url = newPath + (req.url.includes('?') ? '&' : '?') + 'legacy=true';
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}