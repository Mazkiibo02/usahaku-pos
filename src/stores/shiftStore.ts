import { create } from 'zustand';
import { shiftService } from '@/src/features/shifts/api/shift-service';
import type { Shift } from '@/src/features/shifts/types';

interface ShiftState {
  activeShift: Shift | null;
  isLoadingShift: boolean;
  fetchActiveShift: (tenantId: string, cashierId: string) => Promise<Shift | null>;
  openShift: (
    tenantId: string,
    data: {
      cashierId: string;
      cashierName: string;
      outletId: string;
      startingCash: number;
    }
  ) => Promise<string>;
  closeShift: (
    tenantId: string,
    shiftId: string,
    data: {
      actualEndingCash: number;
      notes: string;
    }
  ) => Promise<void>;
  clearShift: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  activeShift: null,
  isLoadingShift: true,
  fetchActiveShift: async (tenantId, cashierId) => {
    if (!tenantId || !cashierId) {
      set({ activeShift: null, isLoadingShift: false });
      return null;
    }
    set({ isLoadingShift: true });
    try {
      const active = await shiftService.getActiveShift(tenantId, cashierId);
      set({ activeShift: active, isLoadingShift: false });
      return active;
    } catch (error) {
      set({ isLoadingShift: false });
      throw error;
    }
  },
  openShift: async (tenantId, data) => {
    try {
      const id = await shiftService.openShift(tenantId, data);
      await get().fetchActiveShift(tenantId, data.cashierId);
      return id;
    } catch (error) {
      throw error;
    }
  },
  closeShift: async (tenantId, shiftId, data) => {
    try {
      await shiftService.closeShift(tenantId, shiftId, data);
      set({ activeShift: null });
    } catch (error) {
      throw error;
    }
  },
  clearShift: () => set({ activeShift: null, isLoadingShift: false }),
}));
