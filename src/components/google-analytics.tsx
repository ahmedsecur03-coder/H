'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const pageview = (GA_MEASUREMENT_ID: string, url: string) => {
  if (typeof window.gtag !== 'function') {
    return;
  }
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

function Analytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}`: '');
    pageview(gaId, url);
  }, [pathname, searchParams, gaId]);
  
  return null;
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
    return (
        <Suspense>
            <Analytics gaId={gaId} />
        </Suspense>
    )
}
