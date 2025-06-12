import bcrypt from 'bcryptjs';

async function testPassword() {
  const password = 'admin123';
  const storedHash = '$2a$10$HKw2ZOr8QLQKuYFxWlbQJOLqnX6PHWvKX.VQ5rGCOPQYYFQXFVd1K';
  
  console.log('Testing password verification...');
  console.log('Password:', password);
  console.log('Stored hash:', storedHash);
  
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password valid:', isValid);
  
  // Test generating a new hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash:', newHash);
  
  const newIsValid = await bcrypt.compare(password, newHash);
  console.log('New hash valid:', newIsValid);
}

testPassword().then(() => process.exit(0)).catch(console.error);