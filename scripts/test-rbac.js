// Test script for RBAC route matching
const matchesParameterizedRoute = (permissionRoute, actualRoute) => {
  // Handle exact matches first
  if (permissionRoute === actualRoute) {
    return true;
  }
  
  // Handle parameterized routes
  if (permissionRoute.includes(':')) {
    // Convert route pattern to regex
    // Example: '/api/admin/conversations/:id' becomes '/api/admin/conversations/[^/]+'
    const regexPattern = permissionRoute.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    
    console.log(`Testing route: ${actualRoute} against pattern: ${regexPattern}`);
    return regex.test(actualRoute);
  }
  
  return false;
};

// Test cases
const testCases = [
  {
    permissionRoute: '/api/admin/conversations/:id',
    actualRoute: '/api/admin/conversations/f111e8fa-329a-4b3d-a286-496dc7f4b3bf',
    expected: true
  },
  {
    permissionRoute: '/api/admin/conversations',
    actualRoute: '/api/admin/conversations',
    expected: true
  },
  {
    permissionRoute: '/api/admin/users/:id',
    actualRoute: '/api/admin/users/123-456-789',
    expected: true
  },
  {
    permissionRoute: '/api/admin/users/:id',
    actualRoute: '/api/admin/conversations/123',
    expected: false
  }
];

console.log('Testing RBAC Route Matching Logic:');
console.log('=====================================');

testCases.forEach((test, index) => {
  const result = matchesParameterizedRoute(test.permissionRoute, test.actualRoute);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Permission Route: ${test.permissionRoute}`);
  console.log(`  Actual Route: ${test.actualRoute}`);
  console.log(`  Expected: ${test.expected}, Got: ${result}`);
  console.log('');
});