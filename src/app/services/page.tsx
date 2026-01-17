
import { Suspense } from 'react';
import { ServicesTable } from '@/app/dashboard/services/_components/services-table';
import { Skeleton } from '@/components/ui/skeleton';
import { getFirestoreServer } from '@/firebase/init-server';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Service, ServicePrice } from '@/lib/types';
import { SMM_SERVICES } from '@/lib/smm-services';

export const revalidate = 3600; // Revalidate every hour

async function getServices(): Promise<Service[]> {
  try {
    const firestore = getFirestoreServer();
    const pricesQuery = query(collection(firestore, 'servicePrices'));
    const pricesSnapshot = await getDocs(pricesQuery);
    const pricesData = pricesSnapshot.docs.map(doc => doc.data() as ServicePrice);

    const pricesMap = new Map<string, number>();
    pricesData.forEach(p => pricesMap.set(p.id, p.price));

    return SMM_SERVICES.map(service => ({
        ...service,
        price: pricesMap.get(String(service.id)) ?? service.price,
    }));
  } catch (error) {
    console.error("Failed to fetch service prices on server:", error);
    // In case of error (e.g., permissions on build server), fall back to static data.
    return SMM_SERVICES;
  }
}


function ServicesPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight font-headline">قائمة الخدمات</h1>
        <p className="text-muted-foreground mt-2">
          استكشف مجموعتنا الواسعة من الخدمات لجميع منصات التواصل الاجتماعي.
        </p>
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function ServicesPageWrapper() {
    const services = await getServices();
    
    return (
        <Suspense fallback={<ServicesPageSkeleton />}>
           <div className="space-y-6 pb-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight font-headline">قائمة الخدمات</h1>
                <p className="text-muted-foreground mt-2">
                استكشف مجموعتنا الواسعة من الخدمات لجميع منصات التواصل الاجتماعي.
                </p>
            </div>
            <ServicesTable services={services} />
            </div>
        </Suspense>
    )
}
