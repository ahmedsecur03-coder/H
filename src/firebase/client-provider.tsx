
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';


// This component now handles creating the user document if it doesn't exist
// This is a fallback and the primary creation logic is now in the signup page transaction.
function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const { firestore } = initializeFirebase(); // Get firestore instance

  useEffect(() => {
    if (!isUserLoading && user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const checkAndCreateUserDoc = async () => {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // User document doesn't exist, create it.
          // This serves as a fallback for social logins or if the signup transaction fails.
          console.warn("User document not found for user:", user.uid, ". Creating a fallback document.");
          const newUser: Omit<UserType, 'id'> = {
            name: user.displayName || `مستخدم #${user.uid.substring(0,6)}`,
            email: user.email || 'N/A',
            rank: 'مستكشف نجمي',
            balance: 0,
            adBalance: 0,
            totalSpent: 0,
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
          try {
            // Using setDoc with merge:true is safer here as a fallback
            await setDoc(userDocRef, newUser, { merge: true });
            console.log("Created fallback user document for user:", user.uid);
          } catch (error) {
            console.error("Error creating fallback user document:", error);
          }
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
