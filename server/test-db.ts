import { db } from './db';
import { tenants, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test tenant lookup
    const demoTenant = await db.select().from(tenants).where(eq(tenants.subdomain, 'demo'));
    console.log('Demo tenant:', demoTenant);
    
    // Test user lookup
    if (demoTenant.length > 0) {
      const adminUser = await db.select().from(users).where(eq(users.email, 'admin@demo.se'));
      console.log('Admin user:', adminUser);
    }
    
    console.log('Database test successful');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase().then(() => process.exit(0)).catch(console.error);