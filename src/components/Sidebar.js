import React, { useState } from 'react';
import './Sidebar.css';
import { 
  HiChatBubbleLeftRight, 
  HiMap, 
  HiNewspaper, 
  HiSquares2X2,
  HiChevronDown,
  HiUser,
  HiArrowUp,
  HiCog6Tooth,
  HiQuestionMarkCircle,
  HiArrowRightOnRectangle,
  HiChevronRight,
  HiDocumentText,
  HiCommandLine,
  HiArrowDownTray,
  HiSun,
  HiMoon,
  HiBuildingOffice2,
  HiBuildingStorefront,
  HiUsers,
  HiChartBar,
  HiChartBarSquare,

  HiMagnifyingGlass
} from 'react-icons/hi2';
import { HiPencil, HiTrash } from "react-icons/hi";

const Sidebar = ({ chatHistory, currentChat, setCurrentChat, isAuthenticated, user, onLoginClick, onLogout, apiService, setChatHistory, darkMode, toggleDarkMode, sidebarOpen, toggleSidebar }) => {
  const [editingSession, setEditingSession] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [showMenu, setShowMenu] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [helpSubmenuOpen, setHelpSubmenuOpen] = useState(false);
  const handleNewChat = () => {
    console.log('New chat button clicked');
    setCurrentChat(null);
  };

  const toggleDiscover = () => {
    setDiscoverOpen(!discoverOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const toggleHelpSubmenu = () => {
    setHelpSubmenuOpen(!helpSubmenuOpen);
  };

  const handleRenameSession = async (sessionId, newName) => {
    if (!newName.trim()) return;
    
    try {
      await apiService.updateSessionTopic(sessionId, newName.trim());
      
      // Update local chat history
      setChatHistory(prev => prev.map(chat => 
        chat.sessionId === sessionId 
          ? { ...chat, title: newName.trim() }
          : chat
      ));
      
      setEditingSession(null);
      setNewSessionName('');
      setShowMenu(null);
      console.log('Session renamed successfully');
    } catch (error) {
      console.error('Failed to rename session:', error);
      alert('Failed to rename session. Please try again.');
    }
  };

  const startEditing = (chat) => {
    setEditingSession(chat.sessionId);
    setNewSessionName(chat.title || '');
    setShowMenu(null);
  };

  const cancelEditing = () => {
    setEditingSession(null);
    setNewSessionName('');
  };

  const handleKeyPress = (e, sessionId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSession(sessionId, newSessionName);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      try {
        await apiService.apiCall('/customer/delete_all', {
          method: 'DELETE'
        });
        
        // Clear local chat history
        setChatHistory([]);
        setCurrentChat(null);
        setShowProfileMenu(false);
        
        console.log('Chat history cleared successfully');
        alert('Chat history cleared successfully!');
      } catch (error) {
        console.error('Failed to clear chat history:', error);
        alert('Failed to clear chat history. Please try again.');
      }
    }
  };

  const handleProfileLogout = () => {
    setShowProfileMenu(false);
    onLogout();
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        // Step 1: Flush the chat memory for this session
        console.log('Flushing chat memory for session:', sessionId);
        await apiService.apiCall(`/customer/chat/${sessionId}`, {
          method: 'DELETE'
        });
        
        // Step 2: Delete the session itself
        console.log('Deleting session:', sessionId);
        await apiService.deleteSession(sessionId);
        
        // Step 3: Update local chat history
        setChatHistory(prev => prev.filter(chat => chat.sessionId !== sessionId));
        
        // If this was the current chat, clear it
        if (currentChat?.sessionId === sessionId) {
          setCurrentChat(null);
        }
        
        setShowMenu(null);
        console.log('Session deleted successfully');
      } catch (error) {
        console.error('Failed to delete session:', error);
        alert('Failed to delete chat. Please try again.');
      }
    }
  };


  // Filter chat history based on search query
  const filteredChatHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      <div className={`sidebar ${darkMode ? 'dark-mode' : ''} ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo" onClick={() => sidebarOpen && toggleSidebar()} style={{ cursor: sidebarOpen ? 'pointer' : 'default', position: 'relative' }}>
          <img src="/logo.png" alt="Propcort Logo" className="logo-image" />
          {sidebarOpen && (
            <button className="close-sidebar-btn" onClick={toggleSidebar} title="Close Sidebar">✕</button>
          )}
        </div>
        <button className="dark-mode-toggle" onClick={toggleDarkMode} title="Toggle Dark Mode">
          {darkMode ? <HiSun /> : <HiMoon />}
        </button>
      </div>

      <div className="sidebar-nav">
        <button className="nav-item active" onClick={handleNewChat}>
          <HiChatBubbleLeftRight className="nav-icon" />
          New Chat
        </button>
        <div className="nav-item discover-item" onClick={toggleDiscover}>
          <HiMap className="nav-icon" /><span className="nav-icon-txt">Discover </span>
          <HiChevronDown className={`dropdown-arrow ${discoverOpen ? 'open' : ''}`} />
        </div>
        {discoverOpen && (
          <div className="discover-dropdown">
            <div className="dropdown-item">
              <HiBuildingOffice2 className="dropdown-icon" />
              <span className="dropdown-text">Residential</span>
            </div>
            <div className="dropdown-item">
              <HiBuildingStorefront className="dropdown-icon" />
              <span className="dropdown-text">Commercial</span>
            </div>
            <div className="dropdown-item">
              <HiUsers className="dropdown-icon" />
              <span className="dropdown-text">Advisory</span>
            </div>
            <div className="dropdown-item">
              <HiChartBar className="dropdown-icon" />
              <span className="dropdown-text">Location Insights</span>
            </div>
            <div className="dropdown-item">
              <HiChartBarSquare className="dropdown-icon" />
              <span className="dropdown-text">Market Analysis</span>
            </div>
          </div>
        )}
        <button className="nav-item">
          <HiNewspaper className="nav-icon" />
          Daily News
        </button>
        <button className="nav-item">
          <HiSquares2X2 className="nav-icon" />
          Spaces
        </button>
      </div>

      <div className="chat-section">
        <div className="chat-section-header">
          <h3 className="chat-section-title">Chats</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-input"
            />
              <HiMagnifyingGlass className="search-icon" style={{ marginRight: '8px' }} />
          </div>
        </div>
        <div className="chat-list">
          {filteredChatHistory.length > 0 ? (
            filteredChatHistory.map((chat, index) => (
              <div 
                key={chat.id || index} 
                className={`chat-item ${currentChat?.sessionId === chat.sessionId ? 'active' : ''}`}
              >
                {editingSession === chat.sessionId ? (
                  <div className="edit-session-container">
                    <textarea
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, chat.sessionId)}
                      className="session-name-input"
                      autoFocus
                      rows={1}
                    />
                    <div className="edit-buttons">
                      <button 
                        className="save-btn"
                        onClick={() => handleRenameSession(chat.sessionId, newSessionName)}
                        title="Save"
                      >
                        ➤
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={cancelEditing}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      console.log('Chat item clicked:', chat);
                      console.log('Session ID to load:', chat.sessionId);
                      console.log('Current chat before change:', currentChat);
                      setCurrentChat(chat);
                    }}
                  >
                    <div className="chat-title">
                      {chat.title || chat.topic || `Chat ${index + 1}`}
                    </div>
                    <div className="chat-menu">
                      <button 
                        className="menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === chat.sessionId ? null : chat.sessionId);
                        }}
                      >
                        ⋮
                      </button>
                      {showMenu === chat.sessionId && (
                        <div className="menu-dropdown">
                          <button 
                            className="menu-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(chat);
                            }}
                          >
                            <HiPencil className="menu-icon" style={{ marginRight: '8px' }} /> Rename
                          </button>
                          <button 
                            className="menu-option delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(chat.sessionId);
                            }}
                          >
                            <HiTrash className="menu-icon" style={{ marginRight: '8px', color: 'red' }} /> <span style={{ color: 'red' }}>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-chats">No chat history</div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        {isAuthenticated ? (
          <>
            <div className="user-profile" onClick={toggleUserDropdown}>
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-status">{user?.plan || 'Free Plan'}</div>
              </div>
            </div>
            {userDropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <HiUser className="dropdown-icon" />
                  <span className="dropdown-text">{user?.email || 'user@example.com'}</span>
                </div>
                <div className="dropdown-item" onClick={() => console.log('Upgrade Plan clicked')}>
                  <HiArrowUp className="dropdown-icon" />
                  <span className="dropdown-text">Upgrade Plan</span>
                </div>
                <div className="dropdown-item" onClick={() => console.log('Settings clicked')}>
                  <HiCog6Tooth className="dropdown-icon" />
                  <span className="dropdown-text">Settings</span>
                </div>
                <div className="dropdown-separator"></div>
                <div className="dropdown-item help-item" onClick={toggleHelpSubmenu}>
                  <HiQuestionMarkCircle className="dropdown-icon" />
                  <span className="dropdown-text">Help</span>
                  <HiChevronRight className={`submenu-arrow ${helpSubmenuOpen ? 'open' : ''}`} />
                </div>
                {helpSubmenuOpen && (
                  <div className="help-submenu">
                    <div className="submenu-item">
                      <HiQuestionMarkCircle className="submenu-icon" />
                      <span className="submenu-text">Help Center</span>
                    </div>
                    <div className="submenu-item">
                      <HiDocumentText className="submenu-icon" />
                      <span className="submenu-text">Terms & Policies</span>
                    </div>
                    <div className="submenu-item">
                      <HiCommandLine className="submenu-icon" />
                      <span className="submenu-text">Keyboard shortcuts</span>
                    </div>
                    <div className="submenu-item">
                      <HiArrowDownTray className="submenu-icon" />
                      <span className="submenu-text">Download App</span>
                    </div>
                  </div>
                )}
                <div className="dropdown-item" onClick={handleProfileLogout}>
                  <HiArrowRightOnRectangle className="dropdown-icon" />
                  <span className="dropdown-text">Log out</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="auth-prompt">
            <button className="login-btn" onClick={onLoginClick}>
              <HiUser className="login-icon" />
              Sign In
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Sidebar;
