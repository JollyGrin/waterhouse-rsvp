// Simple test to check if the database connection is working
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Try to query the database
    // This will throw an error if connection fails
    const result = await prisma.$queryRaw`SELECT 1 as alive`;
    
    console.log('Connection successful!');
    console.log('Query result:', result);
    
    // Check if our models are created
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('\nDatabase tables:');
    tableInfo.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Database setup is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ Database setup has issues.');
      process.exit(1);
    }
  });
