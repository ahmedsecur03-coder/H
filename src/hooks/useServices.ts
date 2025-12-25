
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Service, ServicePrice } from '@/lib/types';
import { SMM_SERVICES } from '@/lib/smm-services';

/**
 * Custom hook to get the definitive list of services by merging
 * static service data with dynamic prices from Firestore.
 * This is the single source of truth for service data in the app.
 *
 * @returns An object containing the list of merged services and a loading state.
 */
export function useServices() {
    const firestore = useFirestore();

    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const pricesQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'servicePrices')) : null),
        [firestore]
    );
    const { data: pricesData, isLoading: pricesLoading } = useCollection<ServicePrice>(pricesQuery);

    useEffect(() => {
        // Start loading only when we actually start processing
        setIsLoading(true);

        if (pricesLoading) {
            // If prices are still loading from Firestore, do nothing yet.
            return;
        }

        // Once price loading is complete, perform the merge.
        if (pricesData) {
            const pricesMap = new Map<string, number>();
            pricesData.forEach(p => pricesMap.set(p.id, p.price));

            const mergedServices = SMM_SERVICES.map(service => ({
                ...service,
                price: pricesMap.get(String(service.id)) ?? service.price, // Fallback to static price if not in DB
            }));
            setServices(mergedServices);
        } else {
            // Fallback to static data if pricesData is null/undefined after loading (e.g., Firestore error)
            console.warn("Could not fetch dynamic prices from Firestore. Falling back to static prices.");
            setServices(SMM_SERVICES);
        }
        
        setIsLoading(false);

    }, [pricesData, pricesLoading]);
    
    return { services, isLoading };
}
