import { create } from 'zustand';

interface CategoryState {
    selectedCategory: string | null;
    setCategory: (category: string | null) => void;
}

export const useCategoryStore = create<CategoryState>()((set) => ({
    selectedCategory: null,
    setCategory: (category) => set({ selectedCategory: category }),
}));
