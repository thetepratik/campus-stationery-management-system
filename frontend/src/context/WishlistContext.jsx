import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { wishlistApi } from '../services/wishlistApi';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { student } = useAuth();
  const [productIds, setProductIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!student) {
      setProductIds(new Set());
      setLoading(false);
      return;
    }
    try {
      const res = await wishlistApi.get();
      setProductIds(new Set(res.data.products.map((p) => p._id)));
    } catch {
      // silent — wishlist state is non-critical to page function
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async (productId) => {
    try {
      const res = await wishlistApi.toggle(productId);
      setProductIds((prev) => {
        const next = new Set(prev);
        if (res.data.added) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.success(res.message);
      return res.data.added;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  }, []);

  const isWishlisted = useCallback((productId) => productIds.has(productId), [productIds]);

  return (
    <WishlistContext.Provider value={{ productIds, count: productIds.size, loading, toggle, isWishlisted, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};
