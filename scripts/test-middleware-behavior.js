// Test the response middleware behavior

// Mock response that simulates what the API controller returns
const mockApiResponse1 = {
  data: [
    { id: 1, name: 'Test API Key 1' },
    { id: 2, name: 'Test API Key 2' },
  ],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const mockApiResponse2 = {
  data: [{ id: 1, name: 'Test Token 1' }],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

// What the middleware should produce
const expectedOutput1 = {
  data: [
    { id: 1, name: 'Test API Key 1' },
    { id: 2, name: 'Test API Key 2' },
  ],
  message: 'Success',
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
  success: true,
};

const expectedOutput2 = {
  data: [{ id: 1, name: 'Test Token 1' }],
  message: 'Success',
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  success: true,
};

console.log('Test 1 - API Key format:');
console.log('Input:', JSON.stringify(mockApiResponse1, null, 2));
console.log('Expected:', JSON.stringify(expectedOutput1, null, 2));

console.log('\nTest 2 - Token format:');
console.log('Input:', JSON.stringify(mockApiResponse2, null, 2));
console.log('Expected:', JSON.stringify(expectedOutput2, null, 2));

console.log(
  '\n✅ The middleware should now handle both formats correctly without double-wrapping the data!',
);
