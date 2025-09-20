import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AuthModal from './components/AuthModal';
import apiService from './services/api';
import { testApiConnectivity, debugAuthFlow } from './utils/testApi';

function App() {
  const [currentChat, setCurrentChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sample chat history for demonstration
  const sampleChatHistory = [
    {
      id: '1',
      title: 'Projects in Whitefield',
      sessionId: 'session_1',
      createdAt: new Date().toISOString()
    },
    {
      id: '2', 
      title: 'Dos before buying pro...',
      sessionId: 'session_2',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      title: 'What is Rera',
      sessionId: 'session_3', 
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token is still valid by making an API call
          const userInfo = await apiService.getCustomerInfo();
          setUser(userInfo);
          setIsAuthenticated(true);
          
          // Load chat sessions after successful authentication
          await loadChatSessions();
        } catch (error) {
          console.error('Auth check failed:', error);
          
          // Only clear auth if it's a 401 (unauthorized) error
          // For server errors (500), keep the user logged in
          if (error.message.includes('status: 401') || error.message.includes('Authentication required')) {
            console.log('Token is invalid, clearing auth');
            apiService.clearAuth();
            setIsAuthenticated(false);
            setUser(null);
          } else {
            console.log('Server error, keeping user logged in with cached data');
            // Keep user logged in but set fallback user data
            setUser({ name: 'User', email: 'user@example.com' });
            setIsAuthenticated(true);
            // Try to load sessions, but don't fail if it doesn't work
            try {
              await loadChatSessions();
            } catch (sessionError) {
              console.log('Could not load sessions, using empty history');
              setChatHistory([]);
            }
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // Show sample data for demo purposes
        setChatHistory(sampleChatHistory);
      }
      setLoading(false);
    };

    // Save chat before page unload
    const handleBeforeUnload = () => {
      if (window.chatInterfaceRef && window.chatInterfaceRef.saveCurrentChatToHistory) {
        window.chatInterfaceRef.saveCurrentChatToHistory();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    checkAuth();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleAuthSuccess = async (response) => {
    try {
      console.log('Auth success, getting user info...');
      const userInfo = await apiService.getCustomerInfo();
      console.log('User info received:', userInfo);
      setUser(userInfo);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      
      // Load chat sessions after successful authentication
      await loadChatSessions();
    } catch (error) {
      console.error('Failed to get user info:', error);
      // Even if getting user info fails, we're still authenticated
      setUser({ name: 'User', email: 'user@example.com' });
      setIsAuthenticated(true);
      setShowAuthModal(false);
      
      // Try to load sessions even if user info fails
      await loadChatSessions();
    }
  };

  const loadChatSessions = async () => {
    try {
      console.log('Loading chat sessions...');
      const sessions = await apiService.getAllSessions();
      console.log('Sessions received:', sessions);
        
      let sessionList = [];
      if (Array.isArray(sessions)) {
        sessionList = sessions;
      } else if (sessions && Array.isArray(sessions.sessions)) {
        sessionList = sessions.sessions;
      } else if (sessions && Array.isArray(sessions.data)) {
        sessionList = sessions.data;
      } else if (sessions && sessions.sessions) {
        sessionList = [sessions.sessions];
      }
      
      console.log('Processed session list:', sessionList);
      
      // Transform sessions into chat history format without loading individual histories
      const chatHistoryItems = sessionList.map((session) => {
        const sessionId = session.session_id || session.id;
        let title = session.topic || session.title;
        
        // Use session topic or generate default title
        if (!title || title === 'General') {
          title = `Chat ${sessionId.substring(0, 8)}`;
        }
        
        return {
          id: sessionId,
          title: title,
          sessionId: sessionId,
          createdAt: session.created_at || session.timestamp
        };
      });
      
      console.log('Chat history items:', chatHistoryItems);
      setChatHistory(chatHistoryItems);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      // Don't throw the error, just set empty history
      setChatHistory([]);
    }
  };

  const handleLogout = async () => {
    // Save current chat to history before logging out
    if (window.chatInterfaceRef && window.chatInterfaceRef.saveCurrentChatToHistory) {
      window.chatInterfaceRef.saveCurrentChatToHistory();
    }
    
    await apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentChat(null);
    setChatHistory([]);
  };

  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="App loading-screen">
        <div className="loading-content">
          <div className="loading-logo">🏠</div>
          <h1>Propcort</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar 
        chatHistory={chatHistory}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        isAuthenticated={isAuthenticated}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        apiService={apiService}
        setChatHistory={setChatHistory}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <ChatInterface 
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowAuthModal(true)}
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
