import { Suspense } from 'react';
import SignupForm from './_components/signup-form';
import { Skeleton } from '@/components/ui/skeleton';

function SignupSkeleton() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-8 z-10">
                <Skeleton className="h-24 w-24 mx-auto rounded-full" />
                <div className="text-center space-y-2">
                    <Skeleton className="h-7 w-48 mx-auto" />
                    <Skeleton className="h-5 w-64 mx-auto" />
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-5 w-48 mx-auto" />
            </div>
        </div>
    );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <SignupForm />
    </Suspense>
  );
}
