
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  forceCollectionUpdate: () => void; // Function to force a re-fetch.
}

const getPathFromRefOrQuery = (refOrQuery: CollectionReference | Query): string => {
    if (refOrQuery.type === 'collection') {
        return (refOrQuery as CollectionReference).path;
    }
    // This is a workaround to access the path from a query.
    // It relies on internal properties and may break in future SDK versions.
    if ((refOrQuery as any)._query?.path) {
        return (refOrQuery as any)._query.path.segments.join('/');
    }
    // Fallback for collection group or other complex queries
    if(refOrQuery instanceof CollectionReference) {
        return refOrQuery.path;
    }
    return `Query on collectionGroup`;
};

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error, and forceCollectionUpdate.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [nonce, setNonce] = useState(0);

  const forceCollectionUpdate = useCallback(() => {
    setNonce(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // Silently log permission errors to the console instead of throwing them,
        // to prevent the app from crashing during development due to recurring permission issues.
        if (error.code === 'permission-denied') {
            console.error("Firestore Permission Denied on collection query:", error.message);
        } else {
            setError(error);
        }
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, nonce]); 

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('A query or collection reference passed to useCollection was not properly memoized using useMemoFirebase. This will cause infinite render loops.');
  }

  return { data, isLoading, error, forceCollectionUpdate };
}
