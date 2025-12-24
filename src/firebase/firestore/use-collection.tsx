'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  getDocs, // Import getDocs
} from 'firebase/firestore';

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


/**
 * React hook to fetch a Firestore collection or query once.
 * This hook is optimized for performance by avoiding real-time listeners.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence. Also make sure that it's dependencies are stable
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(memoizedTargetRefOrQuery);
        const results: ResultItemType[] = [];
        snapshot.forEach(doc => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setData(results);
      } catch (err: any) {
        console.error("useCollection fetch error:", err);
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedTargetRefOrQuery, nonce]); 

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    console.warn('A query or collection reference passed to useCollection was not properly memoized using useMemoFirebase. This can cause performance issues.');
  }

  return { data, isLoading, error, forceCollectionUpdate };
}
