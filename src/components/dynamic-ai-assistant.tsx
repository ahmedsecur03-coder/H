'use client';

import dynamic from 'next/dynamic';

// Dynamically import the AI Assistant component with SSR turned off.
// This ensures it's only loaded on the client-side, resolving the build error.
const AiAssistant = dynamic(() => import('@/components/ai-assistant'), {
  ssr: false,
});

export default function DynamicAiAssistant() {
  return <AiAssistant />;
}
