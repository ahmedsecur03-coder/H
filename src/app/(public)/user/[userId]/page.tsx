'use server';

import UserProfilePageClient from '@/app/(public)/_components/user-profile-page';

export default async function PublicUserProfilePage({ params }: { params: { userId: string } }) {
  // This is now a Server Component. It gets the userId from params
  // and passes it down to the Client Component.
  return <UserProfilePageClient userId={params.userId} />;
}
