"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    doc,
    onSnapshot,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { RestaurantConfig } from '@/types';
import { useToast } from './use-toast';

const DEFAULT_CONFIG: RestaurantConfig = {
    totalTables: 12
};

export function useRestaurantConfig() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [config, setConfig] = useState<RestaurantConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const configRef = doc(db, 'config', 'restaurant');

        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setConfig(docSnap.data() as RestaurantConfig);
            } else {
                // Initialize if not exists
                if (currentUser.role === 'admin') {
                    setDoc(configRef, DEFAULT_CONFIG);
                }
                setConfig(DEFAULT_CONFIG);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to restaurant config:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const updateTables = useCallback(async (count: number) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden cambiar la configuración.");
        }

        if (count < 1 || count > 50) {
            throw new Error("La cantidad de mesas debe estar entre 1 y 50.");
        }

        const configRef = doc(db, 'config', 'restaurant');
        await setDoc(configRef, { totalTables: count }, { merge: true });

        toast({
            title: "Configuración actualizada",
            description: `Se ha establecido el total de mesas en ${count}.`,
        });
    }, [currentUser, toast]);

    return {
        config,
        loading,
        updateTables
    };
}
