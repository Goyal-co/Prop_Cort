// API service for Propcort real estate chat application
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://titanscortex.com';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
    console.log('ApiService initialized with token:', this.token ? 'Present' : 'Missing');
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    // Refresh token from localStorage before each call
    this.token = localStorage.getItem('authToken');
    
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...(this.token && { 'x-token': this.token }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making API call to:', url);
      console.log('Token present:', !!this.token);
      console.log('Config:', config);
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Authentication methods
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  isAuthenticated() {
    // Always check localStorage for the most current token
    const token = localStorage.getItem('authToken');
    this.token = token;
    return !!token;
  }

  // Authentication API methods (TitanBrain Customer API)
  async register(name, email, password) {
    const response = await this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async resetPassword(email) {
    return this.apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    });
  }

  async regenerateToken() {
    const response = await this.apiCall('/auth/regenerate-token', {
      method: 'POST',
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Customer Operations API methods
  async getCustomerInfo() {
    return this.apiCall('/customer/me');
  }

  async updateCustomerInfo(customerData) {
    return this.apiCall('/customer/me', {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer() {
    return this.apiCall('/customer/me', {
      method: 'DELETE',
    });
  }

  async queryAgent(query) {
    const queryParams = new URLSearchParams({ query });
    return this.apiCall(`/customer/query?${queryParams}`, {
      method: 'GET',
    });
  }

  // Session Operations API methods
  async createSession() {
    return this.apiCall('/session/session', {
      method: 'POST',
    });
  }


  async updateSessionTopic(sessionId, topic) {
    const queryParams = new URLSearchParams({
      session_id: sessionId,
      topic: topic,
    });
    
    return this.apiCall(`/session/session?${queryParams.toString()}`, {
      method: 'PATCH',
    });
  }

  async deleteSession(sessionId) {
    return this.apiCall('/session/session', {
      method: 'DELETE',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  }

  async getAllSessions() {
    return this.apiCall('/session/all_sessions', {
      method: 'GET',
    });
  }

  async deleteAllSessions() {
    return this.apiCall('/session/all_sessions', {
      method: 'DELETE',
    });
  }

  // Updated chat methods using sessions
  async queryAgentWithSession(query, sessionId = null) {
    const queryParams = new URLSearchParams({ query });
    if (sessionId) {
      queryParams.append('session_id', sessionId);
      return this.apiCall(`/customer/chat/${sessionId}?${queryParams}`, {
        method: 'GET',
      });
    } else {
      // For new sessions, use the original query endpoint
      return this.apiCall(`/customer/query?${queryParams}`, {
        method: 'GET',
      });
    }
  }

  async getSessionChatHistory(sessionId) {
    return this.apiCall(`/customer/chat_history/${sessionId}`, {
      method: 'GET',
    });
  }

  async flushSessionMemory(sessionId) {
    return this.apiCall(`/customer/chat/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllChatHistory() {
    return this.apiCall('/customer/delete_all/', {
      method: 'DELETE',
    });
  }

  // Property analysis methods (placeholder - to be implemented with actual endpoints)
  async analyzeProperty(propertyData) {
    return this.queryAgent(`Analyze this property: ${JSON.stringify(propertyData)}`);
  }

  async compareProperties(propertyIds) {
    return this.queryAgent(`Compare these properties: ${propertyIds.join(', ')}`);
  }

  // Get all chat sessions (updated to use session-based approach)
  async getChatHistory() {
    try {
      console.log('Fetching all sessions...');
      const response = await this.getAllSessions();
      console.log('Sessions API response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }

  // Flush all memory (updated to use session-based approach)
  async flushMemory() {
    return this.deleteAllSessions();
  }

  // Logout method
  async logout() {
    this.clearAuth();
    return { success: true };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  register,
  login,
  logout,
  resetPassword,
  regenerateToken,
  getCustomerInfo,
  updateCustomerInfo,
  deleteCustomer,
  queryAgent,
  sendMessage,
  getChatHistory,
  createNewChat,
  analyzeProperty,
  compareProperties,
  isAuthenticated,
} = apiService;
