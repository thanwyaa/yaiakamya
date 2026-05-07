'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, signInWithEmail, signUpWithEmail, logoutUser, getCurrentUser } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.name || firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          coins: userData?.coins || 0,
          role: userData?.role || 'student',
          isBlocked: userData?.isBlocked || false,
          ...userData
        });
        setIsAdmin(userData?.role === 'admin');
        setIsGuest(false);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithGoogle();
    return result;
  };

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmail(email, password);
    return result;
  };

  const register = async (email, password, name) => {
    const result = await signUpWithEmail(email, password, name);
    return result;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdmin(false);
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAdmin,
    isGuest,
    loginWithGoogle,
    loginWithEmail,
    register,
    logout,
    loginAsGuest
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
