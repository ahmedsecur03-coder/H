'use client';
import { Suspense } from 'react';
import SignupForm from './_components/signup-form';

function SignupPageContent() {
  return <SignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
