import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { FiHeart } from 'react-icons/fi';
import { wishlistApi } from '../../services/wishlistApi';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/user/ProductCard';

const Wishlist = () => {
  const { productIds } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await wishlistApi.get();
      setProducts(res.data.products);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflects the shared wishlist context immediately (e.g. un-hearting a
  // product right here removes it from view without waiting for a refetch).
  const visibleProducts = products.filter((p) => productIds.has(p._id));

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-5)' }}>My Wishlist</h1>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={280} borderRadius={16} />)}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty-state card" style={{ padding: 'var(--space-12)' }}>
          <FiHeart size={28} color="var(--color-text-muted)" />
          <p>Your wishlist is empty.</p>
          <Link to="/products" className="btn btn--primary" style={{ marginTop: 'var(--space-3)' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {visibleProducts.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
