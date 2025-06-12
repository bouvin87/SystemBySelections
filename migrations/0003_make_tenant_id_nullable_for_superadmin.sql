-- Migration: Make tenantId nullable for superadmin users
-- This allows superadmin users to exist without being tied to any specific tenant

-- Remove the unique constraint on email + tenantId since superadmin email should be globally unique
DROP INDEX IF EXISTS users_email_tenant_id_unique;

-- Make tenant_id nullable
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- Add global unique constraint on email for superadmin users
CREATE UNIQUE INDEX users_email_unique ON users(email);

-- Create a superadmin user
INSERT INTO users (email, hashed_password, role, first_name, last_name, is_active, tenant_id)
VALUES (
  'superuser@replit.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'superadmin',
  'Super',
  'Admin',
  true,
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  role = 'superadmin',
  tenant_id = NULL,
  first_name = 'Super',
  last_name = 'Admin',
  is_active = true;