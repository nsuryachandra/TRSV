import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(() => {
    const cached = localStorage.getItem('tsrv_cached_profile');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem('tsrv_cached_profile');
    try {
      if (cached) {
        const parsed = JSON.parse(cached);
        return { uid: parsed.id, email: parsed.email };
      }
    } catch (e) {
      // Ignored
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('tsrv_session_token') || null);

  // Sync token state to local storage
  useEffect(() => {
    if (token) {
      localStorage.setItem('tsrv_session_token', token);
    } else {
      localStorage.removeItem('tsrv_session_token');
    }
  }, [token]);

  // Synchronize authenticated state from backend PostgreSQL database
  const fetchDbProfile = async (sessionToken) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data.user);
        setCurrentUser({ uid: data.user.id, email: data.user.email });
        // Cache user role and full profile globally to prevent logout on reload
        localStorage.setItem('tsrv_role', data.user.role);
        localStorage.setItem('tsrv_cached_profile', JSON.stringify(data.user));
        return data.user;
      } else {
        console.warn('⚠️ [AuthContext] DB Profile Warning:', data.message);
        if (response.status === 401) {
           handleSessionClear();
        }
      }
    } catch (error) {
      console.error('🚨 [AuthContext] Error fetching DB profile:', error.message);
      // Fall back to locally cached profile to prevent logouts during server sleep/wake or minor connection drops
      const cached = localStorage.getItem('tsrv_cached_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const handleSessionClear = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setToken(null);
    localStorage.removeItem('tsrv_role');
    localStorage.removeItem('tsrv_cached_profile');
    localStorage.removeItem('tsrv_session_token');
  };

  // Local JWT session rehydration on mount
  useEffect(() => {
    const decodeJwt = (token) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    const initSession = async () => {
      const storedToken = localStorage.getItem('tsrv_session_token');
      
      if (storedToken) {
        const decoded = decodeJwt(storedToken);
        // Expiration check (exp is in seconds)
        if (decoded && decoded.exp * 1000 > Date.now()) {
          try {
            const cachedProfile = localStorage.getItem('tsrv_cached_profile');
            let profile = cachedProfile ? JSON.parse(cachedProfile) : null;
            
            // If cached profile is missing or invalid, reconstruct it from token metadata immediately
            if (!profile) {
              profile = {
                id: decoded.uid,
                email: decoded.email,
                role: decoded.role,
                full_name: decoded.name || 'Advocate',
                verified: true
              };
            }
            
            setCurrentUser({ uid: profile.id, email: profile.email });
            setUserProfile(profile);
            setToken(storedToken);
            
            // Sync with backend database in the background without blocking UI render
            fetchDbProfile(storedToken).catch((err) => {
              console.warn('[AuthContext] Background profile sync deferred:', err);
            });
          } catch (e) {
            handleSessionClear();
          }
        } else {
          // Token has expired
          handleSessionClear();
        }
      } else {
        handleSessionClear();
      }
      setLoading(false);
    };
    initSession();
  }, []);

  /**
   * Universal Login handler supporting both standard students and Supreme secret credentials
   */
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Authentication failed. Please verify credentials.');
      }

      setToken(data.token);
      setUserProfile(data.user);
      setCurrentUser({ uid: data.user.id, email: data.user.email });

      localStorage.setItem('tsrv_session_token', data.token);
      localStorage.setItem('tsrv_role', data.user.role);
      localStorage.setItem('tsrv_cached_profile', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Google Sign-In handler (Deprecated in local JWT migration)
   */
  const loginWithGoogle = async () => {
    throw new Error('Google SSO authentication is deprecated. Please register a local student account.');
  };

  /**
   * Student Signup handler with local database registration
   */
  const signup = async (email, password, fullName, phone, constituencyId, collegeId, profileImage) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          constituencyId: constituencyId ? parseInt(constituencyId) : null,
          collegeId: collegeId && !isNaN(collegeId) ? parseInt(collegeId) : null,
          collegeName: collegeId && isNaN(collegeId) ? collegeId : null,
          role: 'student',
          profileImage
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Registration with PostgreSQL node failed.');
      }

      setToken(data.token);
      setUserProfile(data.user);
      setCurrentUser({ uid: data.user.id, email: data.user.email });

      localStorage.setItem('tsrv_session_token', data.token);
      localStorage.setItem('tsrv_role', 'student');
      localStorage.setItem('tsrv_cached_profile', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Global Signout handler
   */
  const logout = async () => {
    try {
      handleSessionClear();
    } catch (error) {
      throw error;
    }
  };

  /**
   * Password reset trigger (Deprecated in local JWT migration)
   */
  const resetPassword = async (email) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to trigger password recovery.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const confirmResetPassword = async (email, code, newPassword) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    token,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    resetPassword,
    confirmResetPassword,
    refreshProfile: () => fetchDbProfile(token)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
