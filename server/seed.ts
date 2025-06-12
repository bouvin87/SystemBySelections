import { storage } from './storage';
import { hashPassword } from './middleware/auth';

/**
 * SEED DATA: Multi-tenant SaaS sample data
 * Creates sample tenants, users, and checklist data for demonstration
 */

async function seedDatabase() {
  console.log('🌱 Seeding multi-tenant SaaS database...');

  try {
    // === CREATE SAMPLE TENANTS ===
    console.log('📂 Creating tenants...');
    
    const tenant1 = await storage.createTenant({
      name: 'Demo Corporation',
      subdomain: 'demo',
      modules: ['checklists']
    });

    const tenant2 = await storage.createTenant({
      name: 'Volvo Manufacturing',
      subdomain: 'volvo',
      modules: ['checklists', 'maintenance']
    });

    const tenant3 = await storage.createTenant({
      name: 'IKEA Production',
      subdomain: 'ikea',
      modules: ['checklists']
    });

    console.log(`✅ Created ${3} tenants`);

    // === CREATE SAMPLE USERS ===
    console.log('👥 Creating users...');
    
    // Demo tenant users
    await storage.createUser({
      tenantId: tenant1.id,
      email: 'admin@demo.se',
      hashedPassword: await hashPassword('admin123'),
      role: 'admin',
      firstName: 'Demo',
      lastName: 'Admin',
      isActive: true
    });

    await storage.createUser({
      tenantId: tenant1.id,
      email: 'user@demo.se',
      hashedPassword: await hashPassword('user123'),
      role: 'user',
      firstName: 'Demo',
      lastName: 'User',
      isActive: true
    });

    // Volvo tenant users
    await storage.createUser({
      tenantId: tenant2.id,
      email: 'admin@volvo.se',
      hashedPassword: await hashPassword('volvo123'),
      role: 'admin',
      firstName: 'Volvo',
      lastName: 'Admin',
      isActive: true
    });

    // IKEA tenant users
    await storage.createUser({
      tenantId: tenant3.id,
      email: 'admin@ikea.se',
      hashedPassword: await hashPassword('ikea123'),
      role: 'admin',
      firstName: 'IKEA',
      lastName: 'Admin',
      isActive: true
    });

    console.log(`✅ Created ${4} users across tenants`);

    // === CREATE SAMPLE CHECKLIST DATA ===
    console.log('📋 Creating checklist module data...');

    // Create data for Demo tenant
    const demoWorkTask = await storage.createWorkTask({
      tenantId: tenant1.id,
      name: 'Production Line Alpha',
      hasStations: true
    });

    const demoWorkStation = await storage.createWorkStation({
      tenantId: tenant1.id,
      name: 'Station 1 - Assembly',
      workTaskId: demoWorkTask.id
    });

    const demoShift = await storage.createShift({
      tenantId: tenant1.id,
      name: 'Dagskift',
      startTime: '06:00',
      endTime: '14:00',
      isActive: true,
      order: 1
    });

    const demoChecklist = await storage.createChecklist({
      tenantId: tenant1.id,
      name: 'Kvalitetskontroll',
      description: 'Daglig kvalitetskontroll för produktionslinje',
      includeWorkTasks: true,
      includeWorkStations: true,
      includeShifts: true,
      isActive: true,
      showInMenu: true,
      hasDashboard: true,
      order: 1,
      icon: 'ClipboardCheck'
    });

    const demoCategory = await storage.createCategory({
      tenantId: tenant1.id,
      checklistId: demoChecklist.id,
      name: 'Säkerhetskontroller',
      description: 'Säkerhetskontroller för arbetsmiljö',
      order: 1,
      isActive: true,
      icon: 'Shield'
    });

    await storage.createQuestion({
      tenantId: tenant1.id,
      categoryId: demoCategory.id,
      text: 'Är alla säkerhetsskydd på plats?',
      type: 'ja_nej',
      options: null,
      validation: null,
      showInDashboard: true,
      dashboardDisplayType: 'card',
      hideInView: false,
      order: 1,
      isRequired: true
    });

    // Create similar data for Volvo (tenant2)
    const volvoWorkTask = await storage.createWorkTask({
      tenantId: tenant2.id,
      name: 'Engine Assembly Line',
      hasStations: true
    });

    const volvoChecklist = await storage.createChecklist({
      tenantId: tenant2.id,
      name: 'Engine Quality Check',
      description: 'Quality control for engine assembly',
      includeWorkTasks: true,
      includeWorkStations: false,
      includeShifts: true,
      isActive: true,
      showInMenu: true,
      hasDashboard: true,
      order: 1,
      icon: 'Settings'
    });

    console.log(`✅ Created sample checklist data for ${2} tenants`);

    // === CREATE SUPERADMIN USER ===
    console.log('🔐 Creating superadmin...');
    
    // Create a special superadmin user (belongs to first tenant but has superadmin role)
    await storage.createUser({
      tenantId: tenant1.id,
      email: 'superadmin@system.se',
      hashedPassword: await hashPassword('super123'),
      role: 'superadmin',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true
    });

    console.log('✅ Created superadmin user');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('Demo Tenant (demo.localhost:3000):');
    console.log('  Admin: admin@demo.se / admin123');
    console.log('  User:  user@demo.se / user123');
    console.log('\nVolvo Tenant (volvo.localhost:3000):');
    console.log('  Admin: admin@volvo.se / volvo123');
    console.log('\nIKEA Tenant (ikea.localhost:3000):');
    console.log('  Admin: admin@ikea.se / ikea123');
    console.log('\nSuperadmin (any subdomain):');
    console.log('  Superadmin: superadmin@system.se / super123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedDatabase };