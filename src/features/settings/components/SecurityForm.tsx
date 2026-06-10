'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Lock, ShieldAlert } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const securitySchema = z.object({
  passwordLama: z.string().min(1, 'Password lama harus diisi.'),
  passwordBaru: z.string().min(6, 'Password baru minimal harus 6 karakter.'),
  konfirmasiPasswordBaru: z.string().min(1, 'Konfirmasi password baru harus diisi.'),
}).refine((data) => data.passwordBaru === data.konfirmasiPasswordBaru, {
  message: 'Konfirmasi password tidak cocok dengan password baru.',
  path: ['konfirmasiPasswordBaru'],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

interface SecurityFormProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function SecurityForm({ showToast }: SecurityFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      passwordLama: '',
      passwordBaru: '',
      konfirmasiPasswordBaru: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: SecurityFormValues) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      showToast('Sesi tidak valid. Silakan login kembali.', 'error');
      return;
    }

    try {
      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, data.passwordLama);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password
      await updatePassword(user, data.passwordBaru);

      showToast('Password berhasil diperbarui! Gunakan password baru Anda pada login berikutnya.', 'success');
      reset();
    } catch (error: any) {
      console.error('Password update failed:', error);
      
      let errorMsg = 'Gagal memperbarui password. Silakan coba lagi nanti.';
      if (error.code === 'auth/wrong-password') {
        errorMsg = 'Password lama yang Anda masukkan salah.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMsg = 'Sesi telah kedaluwarsa. Silakan logout dan login kembali untuk mengubah password.';
      }

      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Informational left pane */}
      <div className="md:col-span-1 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Keamanan Akun
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            Perbarui kata sandi Anda secara berkala untuk menjaga keamanan data usaha Anda dari akses tidak sah.
          </p>
        </div>

        <div className={`rounded-2xl border bg-rose-550/5 p-5 shadow-sm space-y-2 bg-rose-50/30 ${
          errors.passwordBaru ? 'border-rose-100' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0" />
            <span>Aturan Password</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-700">
            Password baru minimal harus terdiri dari 6 karakter. Hindari menggunakan password yang mudah ditebak seperti tanggal lahir atau nama usaha Anda.
          </p>
        </div>
      </div>

      {/* Main form right pane */}
      <div className="md:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col" noValidate>
          <div className="border-b border-slate-150 px-6 py-4">
            <h2 className="text-md font-bold text-slate-900">Ubah Password</h2>
            <p className="text-xs text-slate-550 mt-0.5">
              Masukkan password lama dan password baru Anda untuk melakukan pembaruan.
            </p>
          </div>

          <div className="p-6 space-y-5 flex-1">
            <div className="space-y-2">
              <label htmlFor="passwordLama" className="block text-sm font-medium text-slate-700">
                Password Lama
              </label>
              <input
                id="passwordLama"
                type="password"
                {...register('passwordLama')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="Masukkan password lama Anda"
                disabled={isSubmitting}
              />
              {errors.passwordLama ? (
                <p className="text-xs text-rose-600">{errors.passwordLama.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="passwordBaru" className="block text-sm font-medium text-slate-700">
                Password Baru
              </label>
              <input
                id="passwordBaru"
                type="password"
                {...register('passwordBaru')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="Masukkan password baru (minimal 6 karakter)"
                disabled={isSubmitting}
              />
              {errors.passwordBaru ? (
                <p className="text-xs text-rose-600">{errors.passwordBaru.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="konfirmasiPasswordBaru" className="block text-sm font-medium text-slate-700">
                Konfirmasi Password Baru
              </label>
              <input
                id="konfirmasiPasswordBaru"
                type="password"
                {...register('konfirmasiPasswordBaru')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="Ulangi password baru Anda"
                disabled={isSubmitting}
              />
              {errors.konfirmasiPasswordBaru ? (
                <p className="text-xs text-rose-600">{errors.konfirmasiPasswordBaru.message}</p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-150 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Perbarui Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
