import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { cartApi } from '../services/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { student } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!student) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } catch {
      // silent — cart state is non-critical to page function
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    try {
      const res = await cartApi.addItem(productId, quantity);
      setCart(res.data);
      toast.success(res.message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    try {
      const res = await cartApi.updateItem(productId, quantity);
      setCart(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    try {
      const res = await cartApi.removeItem(productId);
      setCart(res.data);
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const applyCoupon = useCallback(async (code) => {
    try {
      const res = await cartApi.applyCoupon(code);
      setCart(res.data);
      toast.success(res.message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  }, []);

  const removeCoupon = useCallback(async () => {
    try {
      const res = await cartApi.removeCoupon();
      setCart(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const count = cart?.itemsCount || 0;

  return (
    <CartContext.Provider value={{ cart, loading, count, refresh, addItem, updateItem, removeItem, applyCoupon, removeCoupon }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
