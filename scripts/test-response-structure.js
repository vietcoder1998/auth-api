const axios = require('axios');

async function testApiKeyEndpoint() {
  try {
    console.log('Testing API key endpoint...');

    // Test the GET /admin/api-keys endpoint
    const response = await axios.get('http://localhost:3000/api/admin/api-keys', {
      headers: {
        Authorization: 'Bearer your-jwt-token-here', // Replace with actual token
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response data structure:', JSON.stringify(response.data, null, 2));

    // Check if data structure is correct
    const { data } = response.data;

    if (data && data.data) {
      console.log('❌ ERROR: Double nested data structure detected!');
      console.log('Found: data.data instead of just data');
    } else {
      console.log('✅ SUCCESS: Correct data structure');
      console.log('Data array length:', Array.isArray(data) ? data.length : 'Not an array');
    }
  } catch (error) {
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Request error:', error.message);
    }
  }
}

testApiKeyEndpoint();
