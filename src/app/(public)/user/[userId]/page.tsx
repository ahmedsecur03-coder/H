'use server';

import UserProfilePageClient from '@/app/(public)/_components/user-profile-page';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFirestoreServer } from '@/firebase/init-server';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getUser(userId: string): Promise<User | null> {
    const firestore = getFirestoreServer();
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        return null;
    }
    return { id: userDoc.id, ...userDoc.data() } as User;
}

function ProfileSkeleton() {
    return (
        <div className="container max-w-2xl mx-auto py-12">
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default async function PublicUserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const userData = await getUser(userId);

  if (!userData) {
      notFound();
  }

  return (
    <Suspense fallback={<ProfileSkeleton />}>
        <UserProfilePageClient serverUser={userData} />
    </Suspense>
  );
}
