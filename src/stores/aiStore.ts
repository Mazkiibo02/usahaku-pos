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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil analisis AI');
      }

      set({ insights: data.insights, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  clearInsights: () => set({ insights: null, error: null }),
}));
