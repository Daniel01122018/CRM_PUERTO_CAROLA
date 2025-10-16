
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyData } from '@/types';
import { useAuth } from './use-auth';
import { format } from 'date-fns';

export function useDailyData() {
  const { currentUser } = useAuth();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'dailyData', todayStr);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setDailyData(doc.data() as DailyData);
      } else {
        setDailyData(null);
      }
    }, (error) => {
      console.error("Error fetching daily data from Firestore:", error);
      setDailyData(null);
    });

    return () => unsubscribe();
  }, [todayStr]);

  const setInitialCash = useCallback(async (amount: number) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden establecer la caja inicial.");
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    const data: DailyData = {
      date: today,
      initialCash: amount,
    };
    // Usamos setDoc con el ID del día para crear o sobreescribir el documento.
    const docRef = doc(db, 'dailyData', today);
    await setDoc(docRef, data, { merge: true }); // merge: true para no sobreescribir otros campos si los hubiera
  }, [currentUser]);

  return { dailyData, setInitialCash };
}
