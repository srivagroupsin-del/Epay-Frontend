import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BusinessState {
    selectedBusiness: string | null;
    setBusiness: (business: string | null) => void;
}

export const useBusinessStore = create<BusinessState>()(
    persist(
        (set) => ({
            selectedBusiness: null,
            setBusiness: (business) => set({ selectedBusiness: business }),
        }),
        {
            name: 'business-storage',
        }
    )
);
