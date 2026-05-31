import { httpsCallable } from 'firebase/functions';

import { functions } from '@/src/lib/firebase/functions';

type OnboardTenantPayload = {
  tenantName: string;
};

type OnboardTenantResponse = {
  message: string;
  tenantId: string;
};

export async function submitTenantOnboarding(tenantName: string) {
  const onboardTenant = httpsCallable<OnboardTenantPayload, OnboardTenantResponse>(
    functions,
    'onboardTenant',
  );

  return onboardTenant({ tenantName });
}
