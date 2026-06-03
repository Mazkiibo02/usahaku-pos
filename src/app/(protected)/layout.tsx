'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';

import { AppShell } from '@/src/components/layout/app-shell';
import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { useAuthStore } from '@/src/stores/authStore';
import { useShiftStore } from '@/src/stores/shiftStore';
import { db } from '@/src/lib/firebase';
import { SubscriptionLock } from '@/src/components/subscription/SubscriptionLock';

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const { user, tenantId, isLoading } = useAuthStore();
  const { fetchActiveShift } = useShiftStore();
  const isAuthenticated = !!user;

  const [isSubscriptionLocked, setIsSubscriptionLocked] = useState<boolean>(false);
  const [isSubLoading, setIsSubLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.uid && tenantId) {
      fetchActiveShift(tenantId, user.uid).catch(console.error);
    }
  }, [isAuthenticated, user?.uid, tenantId, fetchActiveShift]);

  useEffect(() => {
    if (!isAuthenticated || !tenantId) {
      setIsSubLoading(false);
      return;
    }

    setIsSubLoading(true);
    const docRef = doc(db, 'tenants', tenantId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const subscription = data?.subscription;

          if (!subscription) {
            setIsSubscriptionLocked(false);
          } else {
            const status = subscription.status;
            const currentPeriodEnd = subscription.currentPeriodEnd;
            const isExpiredStatus = status === 'EXPIRED';
            
            let isExpiredDate = false;
            if (currentPeriodEnd) {
              const endDate = currentPeriodEnd.toDate();
              isExpiredDate = endDate.getTime() < Date.now();
            }

            if (isExpiredStatus || isExpiredDate) {
              setIsSubscriptionLocked(true);
            } else {
              setIsSubscriptionLocked(false);
            }
          }
        } else {
          setIsSubscriptionLocked(false);
        }
        setIsSubLoading(false);
      },
      (error) => {
        console.error('Error fetching subscription status:', error);
        setIsSubLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, isAuthenticated]);

  if (isLoading || !isAuthenticated || (isSubLoading && tenantId)) {
    return <FullScreenSpinner />;
  }

  return (
    <AuthGuard fallback={<FullScreenSpinner />}>
      {isSubscriptionLocked ? <SubscriptionLock /> : <AppShell>{children}</AppShell>}
    </AuthGuard>
  );
}
