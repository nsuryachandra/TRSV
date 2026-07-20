import React, { createContext, useContext, useState, useEffect } from 'react';

const OrgContext = createContext();

export const OrgProvider = ({ children }) => {
  const [shortName, setShortName] = useState(() => localStorage.getItem('trsv_short_name') || 'TVRS');
  const [fullName, setFullName] = useState(() => localStorage.getItem('trsv_full_name') || 'Telangana Vidyarthi Rakshana Sena');
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/modules/portal/branding');
      const data = await res.json();
      if (data.success && data.branding) {
        if (data.branding.short_name) {
          setShortName(data.branding.short_name);
          localStorage.setItem('trsv_short_name', data.branding.short_name);
        }
        if (data.branding.full_name) {
          setFullName(data.branding.full_name);
          localStorage.setItem('trsv_full_name', data.branding.full_name);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch org identity branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (shortName) {
      if (document.title.includes('TVRS') || document.title.includes('TRSV')) {
        document.title = document.title.replace(/TVRS|TRSV/g, shortName);
      } else if (!document.title || document.title === 'Vite App' || document.title === 'React App') {
        document.title = `${shortName} Portal`;
      }
    }
  }, [shortName]);

  const updateOrgIdentity = async (newShort, newFull) => {
    const token = localStorage.getItem('trsv_session_token');
    const res = await fetch('/api/modules/portal/branding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        short_name: newShort,
        full_name: newFull
      })
    });
    const data = await res.json();
    if (data.success) {
      setShortName(newShort);
      setFullName(newFull);
      localStorage.setItem('trsv_short_name', newShort);
      localStorage.setItem('trsv_full_name', newFull);
    }
    return data;
  };

  return (
    <OrgContext.Provider value={{ shortName, fullName, updateOrgIdentity, refreshOrgIdentity: fetchBranding, loading }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    return {
      shortName: 'TVRS',
      fullName: 'Telangana Vidyarthi Rakshana Sena',
      updateOrgIdentity: async () => ({ success: false }),
      refreshOrgIdentity: () => {},
      loading: false
    };
  }
  return context;
};
