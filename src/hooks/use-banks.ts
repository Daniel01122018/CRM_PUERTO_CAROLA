"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { BankConfig } from '@/types';
import { useToast } from './use-toast';

const PREDEFINED_BANKS = [
    "Pichincha", "Guayaquil", "Pacífico", "Produbanco", "Bolivariano"
];

export function useBanks() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [banks, setBanks] = useState<BankConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load and subscription
    useEffect(() => {
        if (!currentUser) {
            setBanks([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'banks'),
            orderBy('name')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items: BankConfig[] = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as BankConfig);
            });

            setBanks(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // One-time migration effect
    useEffect(() => {
        const migrateIfNeeded = async () => {
            if (!loading && banks.length === 0 && currentUser?.role === 'admin') {
                console.log("Migrating default banks...");
                const batch = writeBatch(db);
                PREDEFINED_BANKS.forEach(bankName => {
                    const docRef = doc(collection(db, 'banks'));
                    batch.set(docRef, {
                        name: bankName,
                        createdAt: Date.now(),
                        createdBy: 'system'
                    });
                });
                try {
                    await batch.commit();
                } catch (e) {
                    console.error("Bank migration failed", e);
                }
            }
        };

        migrateIfNeeded();
    }, [loading, banks.length, currentUser]);


    const addBank = useCallback(async (name: string) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden gestionar bancos.");
        }

        if (banks.some(b => b.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("Este banco ya existe.");
        }

        await addDoc(collection(db, 'banks'), {
            name,
            createdAt: Date.now(),
            createdBy: currentUser.username
        });
    }, [currentUser, banks]);

    const deleteBank = useCallback(async (id: string) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden gestionar bancos.");
        }
        await deleteDoc(doc(db, 'banks', id));
    }, [currentUser]);

    return {
        banks,
        loading,
        addBank,
        deleteBank
    };
}
