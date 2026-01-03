'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Cairo } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import React, { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser, useFirestore } from '@/firebase/provider';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/google-analytics';
import Head from 'next/head';
import { FloatingActionButtons } from '@/components/floating-action-buttons';
import { doc, getDoc, setDoc, runTransaction, increment, arrayUnion, collection, addDoc } from 'firebase/firestore';
import type { User as UserType, Notification, SystemLog } from '@/lib/types';
import { getRankForSpend, RANKS } from '@/lib/service';


const fontSans = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  variable: '--font-sans',
});

const fontHeadline = Cairo({
  subsets: ['arabic'],
  weight: ['900'],
  variable: '--font-headline',
});

// This component now handles creating the user document if it doesn't exist
// AND increments the daily new user count.
function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore(); // Get firestore instance via hook

  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      return;
    }
    
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const checkAndCreateUserDoc = async () => {
        try {
          await runTransaction(firestore, async (transaction) => {
            // 1. READ all necessary documents
            const userDoc = await transaction.get(userDocRef);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const dailyStatRef = doc(firestore, 'dailyStats', today);
            
            // 2. PERFORM LOGIC
            if (!userDoc.exists()) {
              // --- Logic for NEW user ---
              const newUser: Omit<UserType, 'id'> = {
                name: user.displayName || `مستخدم #${user.uid.substring(0,6)}`,
                email: user.email || 'N/A',
                avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                rank: 'مستكشف نجمي',
                role: 'user',
                balance: 0,
                adBalance: 0,
                totalSpent: 0,
                apiKey: `hy_${crypto.randomUUID()}`,
                referralCode: user.uid.substring(0, 8).toUpperCase(),
                referrerId: null,
                createdAt: new Date().toISOString(),
                affiliateEarnings: 0,
                referralsCount: 0,
                affiliateLevel: 'برونزي',
                notificationPreferences: {
                    newsletter: false,
                    orderUpdates: true,
                },
                notifications: [
                  {
                    id: `welcome-${Date.now()}`,
                    message: 'مرحباً بك في حاجاتي! نحن سعداء بانضمامك إلى رحلتنا الكونية. انقر هنا للذهاب إلى لوحة التحكم.',
                    type: 'success',
                    read: false,
                    createdAt: new Date().toISOString(),
                    href: '/dashboard'
                  }
                ]
              };
              // 3. WRITE operations for new user
              transaction.set(userDocRef, newUser);
              transaction.set(dailyStatRef, { newUsers: increment(1) }, { merge: true });

            } else {
              // --- Logic for EXISTING user ---
              const userData = userDoc.data() as UserType;
              const updates: Partial<UserType> = {};
              
              if (Object.keys(updates).length > 0) {
                transaction.update(userDocRef, updates);
              }
               // --- Proactive Notifications Logic ---
               const notifications = userData.notifications || [];
               const newNotifications: Notification[] = [];
                // Rank-up notification
                const rank = getRankForSpend(userData.totalSpent);
                const currentRankIndex = RANKS.findIndex(r => r.name === rank.name);
                const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;
                const almostRankUpId = `almost-rank-up-${nextRank?.name}`;
                if (nextRank && !notifications.some(n => n.id === almostRankUpId)) {
                    const spendToNext = nextRank.spend - userData.totalSpent;
                    if (spendToNext > 0 && spendToNext < 100) { // Threshold: less than $100 to next rank
                        newNotifications.push({
                            id: almostRankUpId,
                            message: `أنت على وشك الترقية! أنفق ${spendToNext.toFixed(2)}$ فقط للوصول لرتبة ${nextRank.name} والحصول على خصم ${nextRank.discount}%.`,
                            type: 'info',
                            read: false,
                            createdAt: new Date().toISOString(),
                            href: '/dashboard/add-funds'
                        });
                    }
                }
                
                // Low balance notification
                const lowBalanceId = `low-balance-alert-${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`; // One alert per day
                if (userData.balance < 5 && !notifications.some(n => n.id === lowBalanceId)) { // Threshold: less than $5
                      newNotifications.push({
                        id: lowBalanceId,
                        message: `تنبيه: رصيدك منخفض. قم بإعادة الشحن الآن لضمان عدم توقف خدماتك.`,
                        type: 'warning',
                        read: false,
                        createdAt: new Date().toISOString(),
                        href: '/dashboard/add-funds'
                      });
                }
                // 3. WRITE operations for existing user
                 if (newNotifications.length > 0) {
                     transaction.update(userDocRef, {
                         notifications: arrayUnion(...newNotifications)
                     });
                 }
            }
          });
          
          // Log user creation outside the transaction as it's not critical for the transaction's success
          const userDoc = await getDoc(userDocRef);
          if(!userDoc.exists()) {
               const logData: Omit<SystemLog, 'id'> = {
                    event: 'user_created',
                    level: 'info',
                    message: `New user signed up: ${user.email}`,
                    timestamp: new Date().toISOString(),
                    metadata: { userId: user.uid, email: user.email },
                };
                await addDoc(collection(firestore, 'systemLogs'), logData);
          }

        } catch (error) {
             console.error("UserInitializer transaction failed: ", error);
        }
      };

      checkAndCreateUserDoc();
    
  }, [user, isUserLoading, firestore]);

  return null; // This component does not render anything.
}

// This component now correctly uses the pathname *within* a context that has access to it.
function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');
  const isPublicPage = !pathname.startsWith('/dashboard') && !pathname.startsWith('/admin') && !isAuthPage;

  return (
    <>
      <UserInitializer />
      {isPublicPage && <PublicHeader />}
      <div className="flex-1 flex flex-col">
        <main className={cn("flex-1", isPublicPage && "container py-8")}>
          {children}
        </main>
        {isPublicPage && <PublicFooter />}
      </div>
       {!isAuthPage && <FloatingActionButtons />}
    </>
  );
}


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const measurementId = "G-4030VT05Y1";
  
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
       <Head>
        <meta name="theme-color" content="#F39C12" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
         <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className={cn('font-sans antialiased', fontSans.variable, fontHeadline.variable)}>
        <Suspense>
          <GoogleAnalytics gaId={measurementId} />
        </Suspense>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
           <FirebaseClientProvider>
                <div className="flex flex-col min-h-screen">
                    <Suspense fallback={<div className="flex-1" />}>
                        <AppContent>{children}</AppContent>
                    </Suspense>
                </div>
           </FirebaseClientProvider>
           <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
