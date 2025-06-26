# System by Selection - Multi-Tenant SaaS Platform

## Overview

System by Selection is a modern multi-tenant SaaS platform designed for production logging, checklist management, and deviation tracking. The application serves multiple organizations (tenants) with modular functionality that can be enabled per tenant.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: i18next with Swedish and English support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with bcrypt for password hashing
- **Email**: Nodemailer with React Email templates
- **Architecture Pattern**: Multi-tenant with tenant isolation at database level

### Database Design
- **Multi-tenancy**: All tenant-scoped tables include `tenantId` foreign key
- **Modules**: Tenant-specific feature flags determine available functionality
- **Security**: Row-level tenant isolation enforced in application layer
- **Schema**: Shared schema with tenant-scoped data segregation

## Key Components

### Multi-Tenant Core
- **Tenants**: Central tenant management with module configuration
- **Users**: Role-based access control (superadmin, admin, underadmin, user)
- **Authentication**: JWT tokens with tenant context
- **Authorization**: Module-based permissions and role validation

### Module System
The platform uses a modular architecture where tenants can enable specific modules:

1. **Checklists Module**
   - Dynamic form creation and management
   - Work task, work station, and shift organization
   - Response collection and dashboard analytics
   - Configurable question types (text, numbers, switches, stars, etc.)

2. **Deviations Module** (Planned)
   - Issue tracking and management
   - Email notifications
   - Status workflows
   - Assignment and commenting system

### Security Architecture
- **Authentication Middleware**: JWT verification with role validation
- **Tenant Isolation**: Automatic tenant ID injection and validation
- **Module Access Control**: Per-module permission checking
- **API Security**: Comprehensive request validation and sanitization

## Data Flow

### Authentication Flow
1. User provides credentials + optional tenant selection
2. System validates credentials and tenant access
3. JWT token generated with user + tenant context
4. All subsequent requests include tenant context
5. Middleware enforces tenant isolation

### Request Processing
1. **Authentication**: JWT token validation
2. **Tenant Resolution**: Extract tenant context from token
3. **Module Validation**: Verify tenant has access to requested module
4. **Data Access**: Automatic tenant scoping for database queries
5. **Response**: Tenant-scoped data returned

### Multi-Tenant Data Isolation
- All tenant-scoped database operations include tenantId filter
- Middleware prevents cross-tenant data access
- Superadmin users can access tenant management functions
- Regular users restricted to their tenant's data only

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@radix-ui/**: UI component primitives
- **@tanstack/react-query**: Server state management
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **nodemailer**: Email notifications
- **@react-email/**: Email template rendering

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast production bundling
- **vite**: Development server and build tool
- **drizzle-kit**: Database migrations and schema management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles Node.js application to `dist/index.js`
- **Database**: Drizzle Kit manages schema migrations

### Environment Configuration
- **Development**: `npm run dev` - TSX with hot reload
- **Production**: `npm run build && npm run start` - Optimized bundle
- **Database**: `npm run db:push` - Apply schema changes

### Replit Integration
- **Modules**: nodejs-20, web, postgresql-16
- **Auto-deployment**: Configured for autoscale deployment
- **Port Configuration**: Internal 5000 → External 80
- **Database**: Automatic PostgreSQL provisioning

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 26, 2025**: Implemented complete system announcement feature
  - Added system_announcements table with tenant isolation
  - Created SystemAnnouncementModal component for CRUD operations
  - Integrated announcements management in SuperAdmin interface
  - Added toast notifications for active announcements on user login
  - SuperAdmin can create, edit, toggle (activate/deactivate), and delete announcements
  - Only one active announcement can exist at a time per tenant
  - Fixed JSX structure errors and duplicate variable declarations

- **June 25, 2025**: Added "dölj" (hide) functionality for deviations
  - Added isHidden boolean field to deviations table
  - Implemented role-based visibility: hidden deviations only visible to admin/superadmin, creator, assignee, and department manager
  - Added checkbox in DeviationModal for admin/superadmin users to hide deviations
  - Updated backend filtering logic to enforce hidden deviation access rules
  - Modified storage methods to include user context for permission checking
  - Ensured creators can always see their own deviations, even when hidden

- **June 24, 2025**: Added file attachment functionality for deviations
  - Created deviation_attachments table for storing file metadata
  - Implemented file upload with multer supporting images (JPEG, PNG, GIF, WebP) and PDFs
  - Built FileUpload component with drag-and-drop, file validation, and progress tracking
  - Created AttachmentList component showing files with download, preview, and delete options
  - Added attachment management to DeviationModal and deviation detail page
  - Integrated permission-based file upload (only authorized users can upload/delete)
  - Files stored in uploads/deviations directory with unique naming

- **June 24, 2025**: Implemented role-based editing permissions for deviations
  - Only admin/superadmin, creator, assignee, or department manager can edit deviations
  - Edit button now conditionally shows based on user permissions
  - Fixed statusId saving issue in DeviationModal

- **June 24, 2025**: Fixed TypeScript issues in email notification system
  - Resolved color property type mismatches (string | null vs string)
  - Updated all email service function signatures to use transformed objects
  - Standardized email template parameter types across all notification types
  - Ensured department and status information included in all email notifications
  - All 5 email notification types (created, assigned, updated, status changed, comments) now work correctly

- **June 23, 2025**: Initial setup with multi-tenant SaaS architecture

## Changelog

- June 24, 2025: Professional email notification system fully operational
- June 23, 2025: Initial setup