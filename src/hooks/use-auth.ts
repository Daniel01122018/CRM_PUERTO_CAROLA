"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useAuth() {
  // Initialize from localStorage if available for instant load
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('auth_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  // If we have cached user, we are not "loading" visually, but we verify in bg
  const [isLoading, setIsLoading] = useState(!currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Fetch user role from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const finalUser = {
              ...userData,
              username: userData.username || firebaseUser.email || firebaseUser.displayName || 'Usuario',
            };
            setCurrentUser(finalUser);
            // Update cache
            localStorage.setItem('auth_user', JSON.stringify(finalUser));
          } else {
            console.log('User authenticated but no profile found in Firestore');
            const guestUser = {
              username: firebaseUser.email?.split('@')[0] || firebaseUser.displayName || 'Usuario',
              role: 'guest' as any
            };
            setCurrentUser(guestUser);
            localStorage.setItem('auth_user', JSON.stringify(guestUser));
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('auth_user');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Do not clear user immediately on error if we have cache, 
        // but maybe safer to clear if auth failed? 
        // actually if auth failed onAuthStateChanged returns null usually.
        // If firestore failed, we keep cached user or null.
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      // 1. Try with the input as given (in case user typed full email)
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // 2. If input didn't have domain or failed, try appending default domains
        if (!email.includes('@')) {
          try {
            await signInWithEmailAndPassword(auth, `${email}@puertocarola.com`, password);
            return;
          } catch (e) {
            // Ignore and try next
          }

          try {
            await signInWithEmailAndPassword(auth, `${email}@puertocarola.local`, password);
            return;
          } catch (e) {
            // Ignore
          }
        }
      }
      // If we are here, all attempts failed. Throw the original or last error.
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  // Bootstrap function to create the initial admin user
  const claimAdmin = useCallback(async () => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const adminUser: User = {
        username: auth.currentUser.email?.split('@')[0] || 'Admin',
        role: 'admin'
      };
      await setDoc(userDocRef, adminUser);
      // Force reload or state update might be needed, but listener usually picks up doc changes if we listened to doc. 
      // Since we only listen to auth state, we might need to manually update state here or trigger re-fetch.
      // For simplicity, we just set state directly here for immediate feedback.
      setCurrentUser(adminUser);
      return true;
    }
    return false;
  }, []);

  return {
    currentUser,
    login,
    logout,
    isLoading,
    claimAdmin,
    isMounted: !isLoading
  };
}

