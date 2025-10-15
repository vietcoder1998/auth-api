const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testApiKeyCreation() {
  try {
    console.log('Testing API Key creation...');
    
    // First, let's check if we can connect to the database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✓ Database connected');
    
    // Check if User model exists and has some users
    const userCount = await prisma.user.count();
    console.log(`✓ Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('No users found. Creating a test user...');
      const testUser = await prisma.user.create({
        data: {
          name: 'API Test User',
          email: 'api-test@example.com',
          password: 'test-password'
        }
      });
      console.log('✓ Test user created:', testUser.id);
    }
    
    // Get the first user
    const user = await prisma.user.findFirst();
    console.log('✓ Using user:', user.email);
    
    // Test API Key creation
    console.log('Creating API key...');
    const apiKey = await prisma.apiKey.create({
      data: {
        name: 'Test API Key',
        key: 'ak_' + crypto.randomBytes(32).toString('hex'),
        userId: user.id,
        description: 'Test API key for validation',
        rateLimit: 1000,
        allowedIPs: JSON.stringify(['127.0.0.1', '::1']),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true
      }
    });
    
    console.log('✓ API Key created successfully!');
    console.log('  - ID:', apiKey.id);
    console.log('  - Name:', apiKey.name);
    console.log('  - Key prefix:', apiKey.key.substring(0, 10) + '...');
    console.log('  - User ID:', apiKey.userId);
    console.log('  - Rate limit:', apiKey.rateLimit);
    console.log('  - Expires at:', apiKey.expiresAt);
    
    // Test API usage log creation
    console.log('\nCreating usage log...');
    const usageLog = await prisma.apiUsageLog.create({
      data: {
        apiKeyId: apiKey.id,
        endpoint: '/api/test',
        method: 'GET',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        statusCode: 200,
        responseTime: 150
      }
    });
    
    console.log('✓ Usage log created successfully!');
    console.log('  - ID:', usageLog.id);
    console.log('  - Endpoint:', usageLog.endpoint);
    console.log('  - Method:', usageLog.method);
    console.log('  - Status:', usageLog.statusCode);
    console.log('  - Response time:', usageLog.responseTime + 'ms');
    
    // Test relationship query
    console.log('\nTesting relationships...');
    const apiKeyWithUser = await prisma.apiKey.findUnique({
      where: { id: apiKey.id },
      include: {
        user: true,
        apiUsageLogs: true
      }
    });
    
    console.log('✓ API Key with relationships:');
    console.log('  - User name:', apiKeyWithUser.user.email);
    console.log('  - Usage logs count:', apiKeyWithUser.apiUsageLogs.length);
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    await prisma.apiUsageLog.delete({ where: { id: usageLog.id } });
    await prisma.apiKey.delete({ where: { id: apiKey.id } });
    console.log('✓ Test data cleaned up');
    
    console.log('\n🎉 All API Key model tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('✓ Database disconnected');
  }
}

testApiKeyCreation();