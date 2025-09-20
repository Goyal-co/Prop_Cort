import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';
import { 
  HiPlus, 
  HiMicrophone, 
  HiChartBar, 
  HiArrowsRightLeft,
  HiBars3
} from 'react-icons/hi2';
import apiService from '../services/api';

const ChatInterface = ({ currentChat, setCurrentChat, chatHistory, setChatHistory, isAuthenticated, onLoginClick, darkMode, sidebarOpen, toggleSidebar }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentChatTitle, setCurrentChatTitle] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedActions, setSelectedActions] = useState({
    analyze: false,
    compare: false
  });

  const saveCurrentChatToHistory = async () => {
    if (messages.length > 0 && currentChatTitle && currentSessionId && isAuthenticated) {
      try {
        
        // Add current chat to history if not already there
        const newChatItem = {
          id: currentSessionId,
          title: currentChatTitle,
          sessionId: currentSessionId,
          createdAt: new Date().toISOString()
        };
        
        setChatHistory(prev => {
          const exists = prev.some(chat => chat.sessionId === currentSessionId);
          if (!exists) {
            return [newChatItem, ...prev];
          }
          return prev.map(chat => 
            chat.sessionId === currentSessionId 
              ? { ...chat, title: currentChatTitle }
              : chat
          );
        });
      } catch (error) {
        console.error('Failed to update session topic:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      onLoginClick();
      return;
    }

    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      
      // Set chat title from first message if not set
      if (!currentChatTitle && message.trim()) {
        const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
        setCurrentChatTitle(title);
      }
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setIsTyping(true);
      
      try {
        console.log('Sending message to API:', message);
        
        let sessionIdToUse = currentSessionId;
        
        // Always create new session if none exists (for new chats)
        if (!sessionIdToUse) {
          console.log('Creating new session for new chat...');
          const sessionResponse = await apiService.createSession();
          console.log('New session created:', sessionResponse);
          if (sessionResponse && sessionResponse.session_id) {
            sessionIdToUse = sessionResponse.session_id;
            setCurrentSessionId(sessionIdToUse);
            
            // Update chat history immediately with new session
            const newChatItem = {
              id: sessionIdToUse,
              title: currentChatTitle || message.substring(0, 30) + (message.length > 30 ? '...' : ''),
              sessionId: sessionIdToUse,
              createdAt: new Date().toISOString()
            };
            setChatHistory(prev => [newChatItem, ...prev]);
          }
        }
        
        // Use session-based query with proper endpoint
        let response;
        if (sessionIdToUse) {
          // For sessions with ID, use the chat endpoint with session_id
          const queryParams = new URLSearchParams({ query: message, session_id: sessionIdToUse });
          response = await apiService.apiCall(`/customer/chat/${sessionIdToUse}?${queryParams}`, {
            method: 'GET',
          });
        } else {
          // Fallback to regular query endpoint
          response = await apiService.queryAgent(message);
        }
        
        console.log('API response received:', response);
        const aiResponse = {
          id: Date.now() + 1,
          text: response.answer || response.message || response.response || "I'm here to help you with real estate queries. Please provide more details about what you're looking for.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorResponse = {
          id: Date.now() + 1,
          text: `Sorry, I'm having trouble connecting right now. Error: ${error.message}`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  // Effect to handle current chat changes and load chat history
  useEffect(() => {
    console.log('useEffect triggered - Current chat changed:', currentChat);
    console.log('useEffect - currentChat sessionId:', currentChat?.sessionId);
    console.log('useEffect - isAuthenticated:', isAuthenticated);
    
    if (currentChat === null) {
      // Starting a new chat - save current chat to history if it has messages
      console.log('Starting new chat, saving current chat to history');
      saveCurrentChatToHistory();
      setMessages([]);
      setCurrentChatTitle('');
      setCurrentSessionId(null);
    } else if (currentChat && currentChat.sessionId && isAuthenticated) {
      // Loading an existing chat from history
      console.log('Loading existing chat from history:', currentChat);
      console.log('About to call loadChatFromHistory with sessionId:', currentChat.sessionId);
      loadChatFromHistory(currentChat);
    } else {
      console.log('Conditions not met for loading chat history');
      console.log('currentChat exists:', !!currentChat);
      console.log('sessionId exists:', !!currentChat?.sessionId);
      console.log('isAuthenticated:', isAuthenticated);
    }
  }, [currentChat, isAuthenticated]);

  const loadChatFromHistory = async (chat) => {
    try {
      console.log('Loading chat history for session:', chat.sessionId);
      
      // Set loading state immediately
      setCurrentChatTitle(chat.title);
      setCurrentSessionId(chat.sessionId);
      setMessages([]); // Clear current messages while loading
      
      // Skip loading chat history if session ID is invalid or empty
      if (!chat.sessionId || chat.sessionId.length < 5) {
        console.log('Invalid session ID, skipping history load');
        return;
      }
      
      // Try to load chat history for this session using the session ID
      try {
        console.log('Loading chat history for session ID:', chat.sessionId);
        const chatHistory = await apiService.getSessionChatHistory(chat.sessionId);
        console.log('Chat history API response:', chatHistory);
        
        // Transform chat history to messages format
        let historyMessages = [];
        if (Array.isArray(chatHistory)) {
          historyMessages = chatHistory;
        } else if (chatHistory && Array.isArray(chatHistory.chat_history)) {
          historyMessages = chatHistory.chat_history;
        } else if (chatHistory && Array.isArray(chatHistory.messages)) {
          historyMessages = chatHistory.messages;
        } else if (chatHistory && Array.isArray(chatHistory.history)) {
          historyMessages = chatHistory.history;
        } else if (chatHistory && chatHistory.data && Array.isArray(chatHistory.data)) {
          historyMessages = chatHistory.data;
        }
        
        console.log('History messages extracted:', historyMessages);
        
        // Convert to our message format
        const formattedMessages = historyMessages.map((msg, index) => ({
          id: msg.id || Date.now() + index,
          text: msg.message || msg.text || msg.content || msg.query || msg.response,
          sender: (msg.role === 'human' || msg.role === 'user' || msg.sender === 'user' || msg.type === 'user') ? 'user' : 'ai',
          timestamp: new Date(msg.timestamp || msg.created_at || Date.now())
        }));
        
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load chat history for session:', error);
        // Set empty messages if history loading fails
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Still set the session info even if loading fails
      setCurrentChatTitle(chat.title);
      setCurrentSessionId(chat.sessionId);
      setMessages([]);
    }
  };

  // Save chat to history when component unmounts or user logs out
  useEffect(() => {
    // Expose saveCurrentChatToHistory to global scope for logout handling
    window.chatInterfaceRef = { saveCurrentChatToHistory };
    
    return () => {
      saveCurrentChatToHistory();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.chat-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Escape to clear message
      if (e.key === 'Escape') {
        setMessage('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAction = (action) => {
    setSelectedActions(prev => ({
      ...prev,
      [action]: !prev[action]
    }));
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className={`chat-interface ${darkMode ? 'dark-mode' : ''}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <HiBars3 />
        </button>
        <h1 className="mobile-title">Propcort</h1>
        <div className="mobile-spacer"></div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <h1 className="main-chat-title">Propcort</h1>
            {!isAuthenticated && (
              <div className="auth-notice">
                <p>Please sign in to start chatting with our AI assistant</p>
                <button className="auth-notice-btn" onClick={onLoginClick}>
                  Sign In to Continue
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message ai typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chat-input-section">
        <div className="input-container">
          <div className="input-wrapper">
            <HiPlus className="input-icon" />
            <textarea
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={isAuthenticated ? "Ask Anything..." : "Sign in to start chatting..."}
              className="message-input"
              rows="1"
              disabled={!isAuthenticated}
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <button 
              className={`voice-btn ${isRecording ? 'recording' : ''}`} 
              title="Voice input"
              onClick={() => setIsRecording(!isRecording)}
            >
              <HiMicrophone />
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className={`action-btn analyze ${selectedActions.analyze ? 'selected' : ''}`}
            onClick={() => toggleAction('analyze')}
          >
            <HiChartBar className="btn-icon" />
            Analyze
          </button>
          <button 
            className={`action-btn compare ${selectedActions.compare ? 'selected' : ''}`}
            onClick={() => toggleAction('compare')}
          >
            <HiArrowsRightLeft className="btn-icon" />
            Compare
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
