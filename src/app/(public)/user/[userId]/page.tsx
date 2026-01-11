'use server';

import UserProfilePageClient from '@/app/(public)/_components/user-profile-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ProfileSkeleton() {
    return (
        <div className="container max-w-2xl mx-auto py-12">
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default async function PublicUserProfilePage({ params }: { params: { userId: string } }) {
  // This is now a Server Component. It gets the userId from params
  // and passes it down to the Client Component.
  return (
    <Suspense fallback={<ProfileSkeleton />}>
        <UserProfilePageClient userId={params.userId} />
    </Suspense>
  );
}
