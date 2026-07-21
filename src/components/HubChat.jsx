import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Users, Shield, MessageSquare, Search, Info, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function HubChat({ user, chatMode = 'admin' }) {
  const { logout, applyExternalToken, silentRefresh } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentChannel, setCurrentChannel] = useState(() => {
    if (chatMode === 'social' || user?.role === 'student') {
      const defaultSector = user.constituency_name || user.hub_name || 'Upcoming Area';
      return `Social-Sector-${defaultSector}`;
    }
    return localStorage.getItem('trsv_active_chat_channel') || 'GH-Global';
  });
  const [mobileView, setMobileView] = useState(() => {
    if (chatMode === 'social' || user?.role === 'student') {
      return 'chat';
    }
    return 'channels';
  }); // 'channels' or 'chat'
  
  const handleSelectChannel = (channelId) => {
    setCurrentChannel(channelId);
    setMobileView('chat');
  };

  const [constituencies, setConstituencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // format: { userId: { name, role } }
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (chatMode === 'social' || user?.role === 'student') {
      const defaultSector = user.constituency_name || user.hub_name || 'Upcoming Area';
      const socialChannel = `Social-Sector-${defaultSector}`;
      if (currentChannel !== socialChannel) {
        setCurrentChannel(socialChannel);
      }
    } else {
      localStorage.setItem('trsv_active_chat_channel', currentChannel);
    }
  }, [currentChannel, user?.role, user?.hub_name, user?.constituency_name, chatMode]);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const isDevOrSupreme = user.role === 'dev' || user.role === 'supreme_admin';

  // 1. Fetch constituencies to enable channel switcher
  useEffect(() => {
    const isLeadership = user.role !== 'student';
    if (isDevOrSupreme || isLeadership) {
      fetch('/api/constituencies')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setConstituencies(data.constituencies);
          }
        })
        .catch(err => console.error('Failed to load constituencies:', err));
    }
  }, [isDevOrSupreme, user.role]);

  // 3. Configure socket connection — create ONCE per user session, not per channel
  useEffect(() => {
    const isNativeMobile = Boolean(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web');
    const socketUrl = isNativeMobile
      ? 'https://trsv-union.onrender.com'
      : (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
    
    // Connect socket ONCE — channel switching is handled by emit, not reconnect
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Allow polling as fallback
      upgrade: true,
      auth: (cb) => {
        const token = localStorage.getItem('trsv_session_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
        cb({ token });
      },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('🔌 [Socket.io] Connected successfully');
      // Join the current channel after (re)connect
      socket.emit('join_channel', currentChannel);
    });

    socket.on('disconnect', (reason) => {
      setSocketConnected(false);
      console.warn('[Socket.io] Disconnected:', reason);
    });

    socket.on('connect_error', async (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
      if (
        !isRefreshingRef.current &&
        err.message &&
        (err.message.includes('Authentication error') || err.message.includes('token'))
      ) {
        isRefreshingRef.current = true;
        try {
          const freshToken = typeof silentRefresh === 'function' ? await silentRefresh() : null;
          if (freshToken) {
            console.log('🔄 [HubChat Socket] Re-authenticating socket with refreshed token...');
            socket.auth = (cb) => cb({ token: freshToken });
            socket.connect();
          }
        } catch (e) {
          console.warn('[Socket.io] Refresh on socket error failed:', e.message);
        } finally {
          setTimeout(() => {
            isRefreshingRef.current = false;
          }, 5000);
        }
      }
    });

    // Accept refreshed tokens emitted by the server and apply to session
    socket.on('token_refreshed', ({ token: refreshed }) => {
      console.log('🔁 [HubChat Socket] Received refreshed token.');
      try {
        if (typeof applyExternalToken === 'function') applyExternalToken(refreshed);
        else localStorage.setItem('trsv_session_token', refreshed);
      } catch (e) {
        localStorage.setItem('trsv_session_token', refreshed);
      }
    });

    // Message listener
    socket.on('new_message', (msg) => {
      // Use a ref-based channel check so we don't need currentChannel in deps
      setMessages(prev => {
        if (prev.some(p => p.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Message edited listener
    socket.on('message_edited', (editedMsg) => {
      setMessages(prev => prev.map(m => m.id === editedMsg.id ? { ...m, message_text: editedMsg.message_text, is_edited: true } : m));
    });

    // Typing listeners
    socket.on('typing_start', (data) => {
      if (data.sender_id !== user.id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.sender_id]: { name: data.sender_name, role: data.sender_role }
        }));
      }
    });

    socket.on('typing_stop', (data) => {
      setTypingUsers(prev => {
        const copy = { ...prev };
        delete copy[data.sender_id];
        return copy;
      });
    });

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]); // Only reconnect when the logged-in user changes

  // 4. Load historical messages on channel switch
  useEffect(() => {
    const token = localStorage.getItem('trsv_session_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || !user.id) return;

    setMessages([]); // Clear messages when switching channel
    fetch(`/api/chat/history/${currentChannel}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          // Only logout on explicit token expiry (401)
          logout();
          throw new Error('Session expired');
        }
        if (res.status === 403) {
          // Access denied — don't logout, just skip loading history
          throw new Error(`Access denied for channel: ${currentChannel}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setMessages(data.messages);
        } else {
          console.error('Failed to load chat history:', data.message);
        }
      })
      .catch(err => console.warn('Chat history fetch:', err.message));

    // Clear typing users for new channel
    setTypingUsers({});

    // Emit join event if socket is already connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_channel', currentChannel);
    }
  }, [currentChannel, user.id]);

  // 5. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // 6. Typing Handlers
  const handleTyping = () => {
    if (!socketRef.current) return;

    // Send typing start event
    socketRef.current.emit('typing_start', {
      channel_id: currentChannel,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role
    });

    // Clear old timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing_stop', {
        channel_id: currentChannel,
        sender_id: user.id
      });
    }, 2000);
  };

  // 7. Send Message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    // Emit socket event (saves message in DB internally on server)
    socketRef.current.emit('send_message', {
      channel_id: currentChannel,
      sender_id: user.id,
      message_text: newMessage.trim()
    });

    // Clear typing immediately
    socketRef.current.emit('typing_stop', {
      channel_id: currentChannel,
      sender_id: user.id
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setNewMessage('');
  };

  // Find user's constituency ID from the list
  const userConstituencyObj = constituencies.find(c => c.constituency_name === user.constituency_name);
  const userConstituencyId = userConstituencyObj?.id;

  // Filter constituencies based on search bar input and user authorization
  const filteredConstituencies = constituencies.filter(c => {
    // Dev/Supreme can see everything
    if (isDevOrSupreme) {
      return c.constituency_name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    // Parent hub admins can see their sub-constituencies
    if (userConstituencyId && c.parent_id === userConstituencyId) {
      return c.constituency_name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return false;
  });

  // Helper to format role names elegantly
  const formatRole = (role) => {
    if (role === 'dev') return 'Developer';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Helper to get role colors
  const getRoleColors = (role) => {
    if (role === 'dev') return { 
      text: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20', 
      glow: 'border-rose-200 dark:border-rose-500/25 shadow-sm' 
    };
    if (role === 'supreme_admin') return { 
      text: 'text-violet-750 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20', 
      glow: 'border-violet-200 dark:border-violet-500/25 shadow-sm' 
    };
    return { 
      text: 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20', 
      glow: 'border-slate-200 dark:border-slate-800' 
    };
  };

  const isLeader = user?.role !== 'student';
  const hasMultipleSocialSectors = isDevOrSupreme || filteredConstituencies.length > 0;
  const showSidebar = chatMode !== 'social'
    ? isLeader
    : isLeader && hasMultipleSocialSectors;
  const socialNeedsLocation = !isLeader && (chatMode === 'social' || user?.role === 'student') && (!user?.hub_name || user.hub_name === 'Upcoming Area' || !user?.constituency_name || !user?.constituency_id);

  const welcomeMessage = {
    id: '__welcome__',
    sender_id: 'system',
    sender_name: 'TVRS',
    sender_role: 'system',
    message_text: '👋 Hi, Welcome to the chat!',
    created_at: '1970-01-01T00:00:00.000Z',
  };
  const displayMessages = [welcomeMessage, ...messages];

  return (
    <div className="flex flex-col lg:flex-row gap-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 flex-1 min-h-0 shadow-xs overflow-hidden">
      
      {/* SIDEBAR: Channels & Switcher */}
      {showSidebar && (
        <div className={`w-full lg:w-[280px] shrink-0 lg:border-r border-slate-100 dark:border-slate-800/80 lg:pr-6 flex flex-col h-full overflow-hidden ${
          mobileView === 'channels' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5 shrink-0 h-[57px]">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight uppercase leading-none">Messenger</h3>
          </div>
          {/* Channels List */}
          <div className="space-y-5 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent mt-4">
            
            {chatMode === 'social' ? (
              /* ── SOCIAL MODE SIDEBAR ── */
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-1 block">
                  Social Lounges
                </span>

                {/* Own Social-Sector channel */}
                {user.constituency_name && (
                  <button
                    onClick={() => handleSelectChannel(`Social-Sector-${user.constituency_name}`)}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer border ${
                      currentChannel === `Social-Sector-${user.constituency_name}`
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      currentChannel === `Social-Sector-${user.constituency_name}` ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-semibold text-xs">{user.constituency_name} Social</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Main Social Hub</div>
                    </div>
                  </button>
                )}

                {/* Child / All Social-Sector channels */}
                {(isDevOrSupreme || filteredConstituencies.length > 0) && (
                  <div className="pt-3 flex flex-col border-t border-slate-100 dark:border-slate-800/80 gap-2.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 block">
                      {isDevOrSupreme ? 'All Social Lounges' : 'Sub-Area Social Lounges'}
                    </span>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search Area..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 text-xs rounded-xl py-2 pl-9 pr-3 text-slate-900 dark:text-slate-200 focus:outline-none placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1.5 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {(isDevOrSupreme ? constituencies : filteredConstituencies).map((c) => {
                        const channelKey = `Social-Sector-${c.constituency_name}`;
                        const isActive = currentChannel === channelKey;
                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectChannel(channelKey)}
                            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-between cursor-pointer border ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <span className="truncate">💬 {c.constituency_name}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse shrink-0 ml-1.5" />}
                          </button>
                        );
                      })}
                      {filteredConstituencies.length === 0 && !isDevOrSupreme && (
                        <div className="text-xs text-slate-400 text-center py-4 font-medium">No sub-areas available.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── ADMIN MODE SIDEBAR ── */
              <>
                {/* Main Lounges */}
                <div className="space-y-2">
                  {/* Global channel */}
                  {user.role !== 'student' && (
                    <button
                      onClick={() => handleSelectChannel('GH-Global')}
                      className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer border ${
                        currentChannel === 'GH-Global'
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        currentChannel === 'GH-Global' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                      }`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-semibold text-xs">Statewide Lounge</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">All State Admins</div>
                      </div>
                    </button>
                  )}

                  {/* Regular Admin Constituency channel */}
                  {user.role !== 'student' && !isDevOrSupreme && user.constituency_name && (
                    <button
                      onClick={() => handleSelectChannel(`GH-Constituency-${user.constituency_name}`)}
                      className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer border ${
                        currentChannel === `GH-Constituency-${user.constituency_name}`
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        currentChannel === `GH-Constituency-${user.constituency_name}` ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                      }`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-semibold text-xs">{user.constituency_name} Chat</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Local Area Group</div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Area Switcher (Dev/Supreme or Parent Hub leaders - Leadership only) */}
                {user.role !== 'student' && (isDevOrSupreme || filteredConstituencies.length > 0) && (
                  <div className="pt-3 flex flex-col border-t border-slate-100 dark:border-slate-800/80 gap-2.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 block">
                      {isDevOrSupreme ? 'All Area Switcher' : 'Sub-Area Switcher'}
                    </span>
                    
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search Area..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 text-xs rounded-xl py-2 pl-9 pr-3 text-slate-900 dark:text-slate-200 focus:outline-none placeholder-slate-400"
                      />
                    </div>

                    {/* Scrollable list */}
                    <div className="space-y-1.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {filteredConstituencies.map((c) => {
                        const channelKey = `GH-Constituency-${c.constituency_name}`;
                        const isActive = currentChannel === channelKey;
                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectChannel(channelKey)}
                            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-between cursor-pointer border ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <span className="truncate">📍 {c.constituency_name}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse shrink-0 ml-1.5" />}
                          </button>
                        );
                      })}
                      {filteredConstituencies.length === 0 && (
                        <div className="text-xs text-slate-400 text-center py-4 font-medium">No area match.</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Socket status */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Live Server</span>
            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2">
                {socketConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${socketConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${socketConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {socketConnected ? 'Online' : 'Reconnecting'}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* CHAT DISPLAY WINDOW */}
      <div className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden ${showSidebar ? 'lg:pl-6' : ''} ${
        !showSidebar || mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Header */}
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 h-[57px]">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <button
                onClick={() => setMobileView('channels')}
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mr-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="text-left">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight flex items-center gap-2 uppercase leading-none">
                {currentChannel === 'GH-Global' 
                  ? '🌐 Statewide Governance Lounge' 
                  : currentChannel.startsWith('Social-Sector-')
                    ? `💬 Hub: ${currentChannel.replace('Social-Sector-', '')} Social`
                    : `📍 Group: ${currentChannel.replace('GH-Constituency-', '')}`}
              </h4>
            </div>
          </div>
        </div>

        {/* Messages */}
        {socialNeedsLocation ? (
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="max-w-xl text-center p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col items-center gap-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Set your area to join Social Chat</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Please set your campus or constituency in your profile before joining Social Chat. This ensures you are connected to your correct local lounge.</p>
              <a href="/dashboard/student" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-xs">Set Location</a>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {displayMessages.map((msg) => {
            if (msg.id === '__welcome__') {
              return (
                <div key="__welcome__" className="flex justify-center py-2">
                  <div className="text-center px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
                    {msg.message_text}
                  </div>
                </div>
              );
            }
            const isMe = msg.sender_id === user.id;
            const roleStyle = getRoleColors(msg.sender_role);
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] sm:max-w-[70%] transition-all duration-200 ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Meta info header */}
                <div className="flex items-center gap-2 mb-1 text-[10px]">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{msg.sender_name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold border uppercase tracking-wider ${roleStyle.text}`}>
                    {formatRole(msg.sender_role)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {isMe && editingMessageId !== msg.id && (
                    <button 
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditingText(msg.message_text);
                      }}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 ml-1 transition-colors text-[10px] cursor-pointer flex items-center gap-1 font-semibold"
                      title="Edit message"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all duration-200 ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs font-medium'
                      : `bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs ${roleStyle.glow}`
                  }`}
                >
                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-[220px] text-slate-900">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 text-[10px]">
                        <button 
                          type="button"
                          onClick={() => setEditingMessageId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (editingText.trim() && socketRef.current) {
                              socketRef.current.emit('edit_message', {
                                id: msg.id,
                                channel_id: currentChannel,
                                message_text: editingText.trim()
                              });
                            }
                            setEditingMessageId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <span className="break-all whitespace-pre-wrap">{msg.message_text}</span>
                      {msg.is_edited && (
                        <span 
                          className="text-[8px] text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-1.5 py-0.5 rounded-md ml-2 font-semibold tracking-wider uppercase select-none align-middle" 
                          title="Message edited. Stored permanently for security audits."
                        >
                          edited
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          

          <div ref={messagesEndRef} />
        </div>
      )}

      {!socialNeedsLocation && (
          <>
            {/* Typing indicator bar */}
            <div className="h-6 text-[10px] text-blue-600 dark:text-blue-400 font-medium pl-2 italic flex items-center mb-1 shrink-0">
              <AnimatePresence>
                {Object.keys(typingUsers).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" />
                    <span>
                      {Object.values(typingUsers).map(u => `${u.name} (${formatRole(u.role)})`).join(', ')}{' '}
                      {Object.keys(typingUsers).length === 1 ? 'is typing...' : 'are typing...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type operations update..."
                className="flex-1 bg-transparent border-0 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none text-xs sm:text-sm placeholder-slate-400 focus:ring-0 font-medium"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:pointer-events-none text-white p-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}
