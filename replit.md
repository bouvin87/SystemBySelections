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

- **July 16, 2025**: Fixed Tailwind CSS 4 compatibility issues
  - Updated from Tailwind CSS 3.4.17 to 4.1.11 for better performance and features
  - Installed @tailwindcss/postcss package for proper PostCSS integration
  - Updated postcss.config.js to use @tailwindcss/postcss instead of tailwindcss
  - Converted @apply-based CSS classes to vanilla CSS for better compatibility
  - Removed unsupported @theme directive and cleaned up configuration
  - Application now runs without CSS compilation errors

- **July 10, 2025**: Completed transition from boolean flags to relational data in FormModal
  - Updated FormModal logic to use `workTasks.length > 0` instead of `currentChecklist?.includeWorkTasks`
  - Updated validation and submission logic to check data availability rather than configuration flags
  - Changed field visibility logic to be based on actual data relationships from checklist_work_tasks table
  - Updated question filtering logic to use `workTasks.length` dependency instead of `includeWorkTasks`
  - All form functionality now properly uses the new relational data structure for better data integrity

- **July 10, 2025**: Implemented UserKanbanPreference system for QuickAccess functionality
  - Added `user_kanban_preferences` table with UUID primary key, user/board foreign keys
  - Unique constraint on (user_id, board_id) to prevent duplicate preferences per user-board combination
  - Added storage layer methods with proper upsert functionality for preference management
  - Created comprehensive API endpoints (/api/kanban/preferences) for CRUD operations
  - Support for showInQuickAccess boolean and pinnedPosition integer for ordering
  - All operations are user-scoped and properly authenticated via JWT token validation

- **July 8, 2025**: Implemented proper dnd-kit sortable multiple containers pattern
  - Rebuilt Kanban details page using official dnd-kit multiple containers approach
  - Implemented proper SortableContext per column with verticalListSortingStrategy
  - Used closestCorners collision detection for better cross-column dragging
  - Separated drag handling: handleDragOver for cross-column moves, handleDragEnd for same-column reordering
  - Clean component structure with proper event handling and button interactions
  - Professional drag-and-drop experience following dnd-kit documentation standards

- **July 7, 2025**: Implemented UserHasDepartment relationship system
  - Added `user_has_departments` table with UUID primary key
  - Created foreign key relationships to users and departments tables
  - Built complete CRUD API endpoints (/api/user-departments, /api/users/:id/departments, /api/departments/:id/users)
  - Added storage layer methods with tenant isolation and proper validation
  - All operations are admin-restricted and support many-to-many user-department relationships
  - Endpoints include creation, deletion, and querying of user-department assignments

- **July 3, 2025**: Implemented comprehensive role management system
  - Added `roles` table with tenant-scoped role definitions (id, tenant_id, name, description)
  - Added `user_has_roles` junction table for many-to-many user-role relationships
  - Created complete CRUD API endpoints for role management (/api/roles)
  - Added user-role relationship endpoints (/api/users/:id/roles, /api/user-roles)
  - Implemented storage layer with tenant isolation and proper foreign key relationships
  - All operations are admin-restricted and tenant-scoped for security
  - Support for multiple roles per user within tenant boundaries

- **July 1, 2025**: Restored stable Tailwind configuration
  - Reverted Tailwind config to use hardcoded color values for better stability
  - Maintained original color palette that works well with existing components
  - Kept modern CSS design system in index.css for custom styling
  - Ensured consistent styling across all UI components

- **January 1, 2025**: Modernized visual theme to match financial app design
  - Updated color palette with softer, more professional colors
  - Implemented modern card styling with gradients and rounded corners
  - Enhanced navigation bar with backdrop blur and modern styling
  - Added new CSS utility classes for consistent design system
  - Updated home page to use new modern card and action button styles

- **December 30, 2024**: Updated home page with relevant production data
  - Replaced irrelevant financial data with production statistics
  - Added real-time counters for today's controls and open deviations
  - Created smart routing for mobile/desktop modal handling
  - Integrated quick actions for creating new checklists and deviations
  - Added recent activity feed and status cards with relevant metrics
  - Implemented device-aware navigation (mobile users get separate pages, desktop gets modals)

- **June 27, 2025**: Enhanced mobile experience and validation system
  - Implemented comprehensive toast validation for both DeviationModal and FormModal
  - Fixed global toast system with proper state management
  - Improved mobile layout for FormModal with responsive button positioning
  - Added mobile-first meta tags to hide URL bar and improve fullscreen experience
  - DeviationModal now uses fullscreen on mobile while maintaining desktop modal behavior
  - All validation messages now clearly indicate missing required fields

- **June 26, 2025**: Completed custom fields system implementation
  - Created custom_fields, custom_field_deviation_type_mappings, and custom_field_values database tables
  - Built comprehensive backend API with full CRUD operations for custom fields
  - Implemented CustomFieldModal and CustomFieldsList components for admin interface
  - Added "Extrafält" tab in deviations administration panel
  - Support for text, number, checkbox, date, and select field types with configurable options
  - Custom fields can be linked to specific deviation types with required field validation
  - Fixed authentication issues in API calls to ensure proper data loading

- **June 26, 2025**: Implemented complete global system announcement feature
  - Added system_announcements table as global (removed tenant isolation per user request)
  - Created SystemAnnouncementModal component for CRUD operations
  - Integrated announcements management in SuperAdmin interface
  - Added toast notifications for active announcements on user login (displayed to ALL users globally)
  - SuperAdmin can create, edit, toggle (activate/deactivate), and delete global announcements
  - Only one active announcement can exist at a time across entire system
  - Fixed JSX structure errors and duplicate variable declarations
  - Updated backend API routes to handle global announcements without tenant restrictions

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