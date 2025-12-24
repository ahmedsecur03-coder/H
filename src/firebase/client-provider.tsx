'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction, increment } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';


// This component now handles creating the user document if it doesn't exist
// AND increments the daily new user count.
function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const { firestore } = initializeFirebase(); // Get firestore instance

  useEffect(() => {
    if (!isUserLoading && user && firestore) {
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
                }
              };
              transaction.set(userDocRef, newUser);

              // Also increment the new user count for today
              const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
              const dailyStatRef = doc(firestore, 'dailyStats', today);
              transaction.set(dailyStatRef, {
                  newUsers: increment(1)
              }, { merge: true });

            } else if (!userDoc.data().role) {
                // Document exists but is missing the role (older user), update it
                transaction.update(userDocRef, { role: 'user' });
            }
            // If doc exists and has a role, do nothing.
          });
        } catch (error) {
             // Silently catch errors here, as this is a background process.
        }
      };

      checkAndCreateUserDoc();
    }
  }, [user, isUserLoading, firestore]);

  return null; // This component does not render anything.
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <UserInitializer />
      {children}
    </FirebaseProvider>
  );
}
