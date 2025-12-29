'use client';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service, ServicePrice } from '@/lib/types';
import { SMM_SERVICES } from '@/lib/smm-services';

export function useServices() {
    const firestore = useFirestore();

    const pricesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'servicePrices')) : null), [firestore]);
    const { data: pricesData, isLoading: pricesLoading, forceCollectionUpdate } = useCollection<ServicePrice>(pricesQuery);

    const mergedServices = useMemo(() => {
        if (pricesLoading) {
            // Return static data while prices are loading to avoid layout shifts
            return SMM_SERVICES;
        }

        if (!pricesData) {
            return SMM_SERVICES;
        }
        
        const pricesMap = new Map<string, number>();
        pricesData.forEach(p => pricesMap.set(p.id, p.price));

        return SMM_SERVICES.map(service => ({
            ...service,
            price: pricesMap.get(String(service.id)) ?? service.price,
        }));
    }, [pricesData, pricesLoading]);

    return { services: mergedServices, isLoading: pricesLoading, forceCollectionUpdate };
}
