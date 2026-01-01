
'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction, increment, arrayUnion, collection, addDoc } from 'firebase/firestore';
import type { User as UserType, Notification, SystemLog } from '@/lib/types';
import { getRankForSpend, RANKS } from '@/lib/service';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';


// This component now handles creating the user document if it doesn't exist
// AND increments the daily new user count.
function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const { firestore } = initializeFirebase(); // Get firestore instance

  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      return;
    }
    
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const checkAndCreateUserDoc = async () => {
        try {
          await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            
            if (!userDoc.exists()) {
              // User document doesn't exist, create it and update stats
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
              transaction.set(userDocRef, newUser);

              // Also increment the new user count for today
              const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
              const dailyStatRef = doc(firestore, 'dailyStats', today);
              transaction.set(dailyStatRef, {
                  newUsers: increment(1)
              }, { merge: true });

              // Log this event to system logs
               const logData: Omit<SystemLog, 'id'> = {
                    event: 'user_created',
                    level: 'info',
                    message: `New user signed up: ${user.email}`,
                    timestamp: new Date().toISOString(),
                    metadata: { userId: user.uid, email: user.email },
                };
                // We add this outside the transaction, as it's a non-critical log
                addDoc(collection(firestore, 'systemLogs'), logData);

            } else {
              // Document exists, check for missing fields and update if necessary
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
                 if (newNotifications.length > 0) {
                     transaction.update(userDocRef, {
                         notifications: arrayUnion(...newNotifications)
                     });
                 }
            }
          });
        } catch (error) {
             console.error("UserInitializer transaction failed: ", error);
        }
      };

      checkAndCreateUserDoc();
    
  }, [user, isUserLoading, firestore]);

  return null; // This component does not render anything.
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // initializeFirebase() is now safe to call here, as useEffect only runs on the client.
    setFirebaseServices(initializeFirebase());
  }, []);


  if (!firebaseServices) {
    // You can render a loader here if you want,
    // but the layout already has a loader for the user state,
    // which effectively covers this.
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <UserInitializer />
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}

