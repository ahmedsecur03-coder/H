'use client' 

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
         <div className="z-10 flex flex-col items-center">
            <AlertTriangle className="h-24 w-24 text-destructive animate-pulse" />
             <h1 className="mt-8 text-3xl font-bold font-headline">
                عذراً... حدث خطأ غير متوقع
            </h1>
             <p className="mt-2 max-w-md text-muted-foreground">
                واجه النظام مشكلة أثناء معالجة طلبك. نعتذر عن هذا الإزعاج. يمكنك محاولة تحديث الصفحة أو العودة إلى لوحة التحكم الرئيسية.
            </p>
            <div className="mt-8 flex gap-4">
                <Button variant="outline" onClick={() => reset()}>
                    <RefreshCw className="ml-2 h-4 w-4" />
                    إعادة المحاولة
                </Button>
                 <Button asChild>
                    <Link href="/dashboard">
                        <Home className="ml-2 h-4 w-4" />
                        العودة للرئيسية
                    </Link>
                </Button>
            </div>

            {error?.digest && (
                <p key={error.digest} className="mt-4 text-xs text-muted-foreground font-mono">
                    معرف الخطأ: {error.digest}
                </p>
            )}
        </div>
    </div>
  )
}
