'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from '@/lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'students', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          const newUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            photoURL: firebaseUser.photoURL,
            chemicalCoins: 100,
            totalStudyHours: 0,
            currentStreak: 0,
            longestStreak: 0,
            quizzesCompleted: 0,
            lecturesWatched: [],
            role: 'student',
            level: 'Bronze',
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          };
          await setDoc(userRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await result.user.updateProfile({ displayName: name });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = userData?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
