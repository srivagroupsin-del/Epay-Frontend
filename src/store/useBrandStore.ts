import { create } from 'zustand';

interface BrandState {
    selectedBrand: string | null;
    setBrand: (brand: string | null) => void;
}

export const useBrandStore = create<BrandState>()((set) => ({
    selectedBrand: null,
    setBrand: (brand) => set({ selectedBrand: brand }),
}));
