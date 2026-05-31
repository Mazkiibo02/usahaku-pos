import { OnboardingForm } from '@/src/features/onboarding/components/onboarding-form';

export default function OnboardingPage() {
  return (
    <section className="flex min-h-[calc(100svh-8rem)] items-center justify-center px-2 py-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to Usahaku POS
          </h1>
          <p className="text-sm text-slate-600">
            Let&apos;s set up your business profile to activate your owner workspace.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </section>
  );
}
