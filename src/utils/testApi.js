// Test utility to check API connectivity and functionality
import apiService from '../services/api';

export const testApiConnectivity = async () => {
  console.log('=== Testing API Connectivity ===');
  
  try {
    // Test basic connectivity
    const response = await fetch('https://titanscortex.com', {
      method: 'HEAD',
      mode: 'cors'
    });
    console.log('Basic connectivity test:', response.status);
  } catch (error) {
    console.error('Basic connectivity failed:', error);
  }
  
  // Test registration endpoint
  try {
    console.log('Testing registration endpoint...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const registerResponse = await apiService.register(testUser.name, testUser.email, testUser.password);
    console.log('Registration test result:', registerResponse);
    
    // If registration successful, test login
    if (registerResponse.token) {
      console.log('Testing login with registered user...');
      const loginResponse = await apiService.login(testUser.email, testUser.password);
      console.log('Login test result:', loginResponse);
      
      // Test query endpoint
      if (loginResponse.token || apiService.isAuthenticated()) {
        console.log('Testing query endpoint...');
        const queryResponse = await apiService.queryAgent('Hello, can you help me with real estate?');
        console.log('Query test result:', queryResponse);
      }
    }
  } catch (error) {
    console.error('API test failed:', error);
  }
};

export const debugAuthFlow = () => {
  console.log('=== Auth Debug Info ===');
  console.log('Current token:', localStorage.getItem('authToken'));
  console.log('Is authenticated:', apiService.isAuthenticated());
  console.log('API Base URL:', apiService.baseURL);
};

// Call this function to run tests
if (process.env.NODE_ENV === 'development') {
  window.testApi = testApiConnectivity;
  window.debugAuth = debugAuthFlow;
}
