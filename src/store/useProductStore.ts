import { create } from 'zustand';

interface ProductState {
    selectedProductId: string | null;
    setProductId: (id: string | null) => void;
}

export const useProductStore = create<ProductState>()((set) => ({
    selectedProductId: null,
    setProductId: (id) => set({ selectedProductId: id }),
}));
