import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Shop {
  id: string;
  name: string;
  type: string;
}

interface ShopState {
  selectedShopId: string | null;
  selectedShop: Shop | null;
  shops: Shop[];
  setSelectedShopId: (id: string | null) => void;
  setSelectedShop: (shop: Shop | null) => void;
  setShops: (shops: Shop[]) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      selectedShopId: null,
      selectedShop: null,
      shops: [],
      setSelectedShopId: (id) => set({ selectedShopId: id }),
      setSelectedShop: (shop) =>
        set({
          selectedShop: shop,
          selectedShopId: shop?.id ?? null,
        }),
      setShops: (shops) => set({ shops }),
    }),
    {
      name: 'shop-storage',
      partialize: (state) => ({
        selectedShopId: state.selectedShopId,
      }),
    }
  )
);
