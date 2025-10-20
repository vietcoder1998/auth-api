/**
 * Test script for Login As functionality
 * This tests the complete authentication flow for admin impersonation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testLoginAsFlow() {
  console.log('🔄 Testing Login As functionality...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });

    const adminToken = adminLoginResponse.data.accessToken;
    console.log('✅ Admin login successful');
    console.log('Admin Token:', adminToken.substring(0, 50) + '...\n');

    // Step 2: Use admin token to login as another user
    console.log('2. Admin impersonating user...');
    const loginAsResponse = await axios.post(
      `${BASE_URL}/admin/users/login-as`,
      { email: 'user@example.com' },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const userToken = loginAsResponse.data.accessToken;
    console.log('✅ Login as user successful');
    console.log('User Token:', userToken.substring(0, 50) + '...');
    console.log('Impersonation data:', loginAsResponse.data.impersonation);
    console.log('User data:', loginAsResponse.data.user, '\n');

    // Step 3: Test that the user token works for protected routes
    console.log('3. Testing user token on protected route...');
    const protectedResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    console.log('✅ Protected route access successful with impersonated token');
    console.log('Users count:', protectedResponse.data.length, '\n');

    // Step 4: Validate token using auth/validate endpoint
    console.log('4. Validating impersonated token...');
    const validateResponse = await axios.post(`${BASE_URL}/auth/validate`, {
      token: userToken,
    });

    console.log('✅ Token validation successful');
    console.log('Validation result:', validateResponse.data, '\n');

    console.log('🎉 All tests passed! Login As functionality is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testLoginAsFlow();
