"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';

// Correct mock users based on src/lib/data.ts
const staticUsers = [
  { username: 'Caja001', password: '0123456789', role: 'employee' },
  { username: 'Mesero1', password: '1234567890', role: 'employee' },
  { username: 'admin1', password: 'admin001', role: 'admin' },
  { username: 'cocina', password: 'cocina01', role: 'kitchen' }
];

const setStateToLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }
};

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialState<User | null>('currentUser', null));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const foundUser = staticUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      const user: User = {
        username: foundUser.username,
        role: foundUser.role as 'employee' | 'admin' | 'kitchen',
      };
      setCurrentUser(user);
      setStateToLocalStorage('currentUser', user);
      return user;
    } else {
      throw new Error("Invalid username or password.");
    }
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    setStateToLocalStorage('currentUser', null);
  }, []);

  return { currentUser, login, logout, isMounted };
}
