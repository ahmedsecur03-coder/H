'use client';
import { Suspense } from 'react';
import { ServicesTable } from '@/app/dashboard/services/_components/services-table';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function ServicesPageWrapper() {
    return (
        <Suspense fallback={<ServicesPageSkeleton />}>
           <div className="space-y-6 pb-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight font-headline">قائمة الخدمات</h1>
                <p className="text-muted-foreground mt-2">
                استكشف مجموعتنا الواسعة من الخدمات لجميع منصات التواصل الاجتماعي.
                </p>
            </div>
            <ServicesTable />
            </div>
        </Suspense>
    )
}
