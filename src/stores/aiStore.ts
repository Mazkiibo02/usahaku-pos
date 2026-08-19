import { create } from 'zustand';

interface AiState {
  insights: string | null;
  isLoading: boolean;
  error: string | null;
  fetchInsights: (token: string) => Promise<void>;
  clearInsights: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  insights: null,
  isLoading: false,
  error: null,
  fetchInsights: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Terjadi kesalahan pada server (Respons tidak valid). Pastikan API Key sudah diatur.');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal mengambil analisis AI');
      }

      set({ insights: data.insights, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  clearInsights: () => set({ insights: null, error: null }),
}));
