"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import type { AgentError, AgentErrorSeverity } from '@/types/firebase';

interface ErrorNotificationContextType {
  errors: AgentError[];
  unreadCount: number;
  loading: boolean;
  resolveError: (errorId: string, note?: string) => Promise<void>;
  dismissError: (errorId: string) => void;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

const SEVERITY_CONFIG: Record<AgentErrorSeverity, { color: string; label: string }> = {
  low: { color: 'text-blue-500', label: 'Dusuk' },
  medium: { color: 'text-yellow-500', label: 'Orta' },
  high: { color: 'text-orange-500', label: 'Yuksek' },
  critical: { color: 'text-red-500', label: 'Kritik' },
};

export function ErrorNotificationProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AgentError[]>([]);
  const [loading, setLoading] = useState(true);
  const seenErrorIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!db || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribeErrors: (() => void) | null = null;

    // Wait for authentication before listening to errors
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup previous errors listener if exists
      if (unsubscribeErrors) {
        unsubscribeErrors();
        unsubscribeErrors = null;
      }

      if (!user) {
        // User not authenticated, clear errors and stop loading
        setErrors([]);
        setLoading(false);
        return;
      }

      // User is authenticated, start listening to errors
      const errorsQuery = query(
        collection(db, 'errors'),
        where('resolved', '==', false),
        orderBy('created_at', 'desc'),
        limit(50)
      );

      unsubscribeErrors = onSnapshot(
        errorsQuery,
        (snapshot) => {
          const errorsData: AgentError[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as AgentError[];

          // Show toast for new errors (not on initial load)
          if (!isInitialLoad.current) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const error = { id: change.doc.id, ...change.doc.data() } as AgentError;
                if (!seenErrorIds.current.has(error.id)) {
                  showErrorToast(error);
                }
              }
            });
          }

          // Update seen error IDs
          errorsData.forEach((error) => seenErrorIds.current.add(error.id));

          setErrors(errorsData);
          setLoading(false);
          isInitialLoad.current = false;
        },
        (error) => {
          console.error('Error listening to errors collection:', error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeErrors) {
        unsubscribeErrors();
      }
    };
  }, []);

  const showErrorToast = (error: AgentError) => {
    const config = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.medium;

    toast.error(error.error_message, {
      description: `${error.agent} - ${error.task}`,
      duration: error.severity === 'critical' ? 10000 : 5000,
      id: error.id,
    });
  };

  const resolveError = useCallback(async (errorId: string, note?: string) => {
    if (!db) return;

    try {
      const errorRef = doc(db, 'errors', errorId);
      await updateDoc(errorRef, {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_note: note || null,
      });
      toast.success('Hata cozuldu olarak isaretlendi');
    } catch (error) {
      console.error('Error resolving error:', error);
      toast.error('Hata isaretlenirken bir sorun olustu');
    }
  }, []);

  const dismissError = useCallback((errorId: string) => {
    toast.dismiss(errorId);
  }, []);

  const unreadCount = errors.length;

  return (
    <ErrorNotificationContext.Provider
      value={{
        errors,
        unreadCount,
        loading,
        resolveError,
        dismissError,
      }}
    >
      {children}
    </ErrorNotificationContext.Provider>
  );
}

export function useErrorNotifications() {
  const context = useContext(ErrorNotificationContext);
  if (context === undefined) {
    throw new Error('useErrorNotifications must be used within an ErrorNotificationProvider');
  }
  return context;
}
