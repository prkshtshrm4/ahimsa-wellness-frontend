import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from './api.js';
import { firebaseAuth } from './firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setIdentity(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await api.get('/me');
      setIdentity(me);
      return me;
    } catch {
      setToken(null);
      setIdentity(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const establishSession = useCallback(async (firebaseUser) => {
    const body = {
      name: firebaseUser?.displayName || undefined,
      email: firebaseUser?.email || undefined,
      phone: firebaseUser?.phoneNumber || undefined,
    };
    try {
      await api.post('/auth/session', body);
    } catch {
      /* staff or already provisioned */
    }
  }, []);

  const signInWithToken = useCallback(
    async (token, { user, asPatient = true } = {}) => {
      setToken(token);
      let me = await api.get('/me').catch(() => null);

      if (asPatient && me?.type === 'patient') {
        await establishSession(user || firebaseAuth().currentUser);
        me = await api.get('/me');
      }

      setIdentity(me);
      setLoading(false);
      return me;
    },
    [establishSession]
  );

  const signOut = useCallback(async () => {
    setToken(null);
    setIdentity(null);
    try {
      await firebaseAuth().signOut();
    } catch {
      /* ignore */
    }
  }, []);

  const patient = identity?.type === 'patient' ? identity.patient : null;

  const value = {
    identity,
    loading,
    isStaff: identity?.type === 'staff',
    isPatient: identity?.type === 'patient',
    staff: identity?.staff || null,
    patient,
    needsPhoneLink: Boolean(patient?.needsPhoneLink || (patient && !patient.phone)),
    can: (key) => Boolean(identity?.staff?.grantedModules?.includes(key)),
    signInWithToken,
    signOut,
    refresh,
    establishSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
