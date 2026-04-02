'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, initiateAnonymousSignIn } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // Automatically sign in anonymously if no user is present.
    // This ensures that security rules have a valid 'auth' object,
    // preventing "Missing or insufficient permissions" errors for signed-in users.
    const auth = firebaseServices.auth;
    if (auth) {
      // We check if we already have a user; if not, we trigger the non-blocking sign-in.
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          initiateAnonymousSignIn(auth);
        }
      });
      return () => unsubscribe();
    }
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
