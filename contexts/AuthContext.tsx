"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

  // Check if Firebase is configured
  const isConfigured = !!auth && !!db;

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setAdminCheckDone(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAdminCheckDone(false);

      if (firebaseUser && db) {
        try {
          // Check if user is admin in Firestore
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          setIsAdmin(adminDoc.exists());
        } catch (error) {
          console.error('Admin check failed:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setAdminCheckDone(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Loading true until both auth state AND admin check are complete
  const isLoading = loading || (!adminCheckDone && user !== null);

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    setLoading(true);
    setAdminCheckDone(false);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured');
    setLoading(true);
    setAdminCheckDone(false);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth) throw new Error('Firebase is not configured');
    setIsAdmin(false);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading: isLoading,
        isConfigured,
        signInWithEmail,
        signInWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
