import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { FiArrowRight } from 'react-icons/fi';

import { storeApi } from '../../services/storeApi';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/user/ProductCard';

const CATEGORY_ICON_LETTER = (name) => name?.charAt(0)?.toUpperCase() || '?';

const Home = () => {
  const { student } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await storeApi.getHome();
        if (mounted) setData(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
      {/* ---------- Hero ---------- */}
      <div className="hero-section">
        <h1>Hi {student?.name?.split(' ')[0] || 'there'}, welcome back to Campus Stationery!</h1>
        <p>Everything you need for class — notebooks, pens, files, and more. Order online for pickup or visit us in person.</p>
        <Link to="/products" className="btn btn--secondary btn--lg" style={{ background: '#fff', color: 'var(--color-primary)' }}>
          Shop Now <FiArrowRight size={16} />
        </Link>
      </div>

      {/* ---------- Categories ---------- */}
      <div className="store-section">
        <div className="store-section__header">
          <span className="store-section__title">Shop by Category</span>
        </div>
        {loading ? (
          <div className="category-pill-grid">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={130} borderRadius={16} />)}
          </div>
        ) : (
          <div className="category-pill-grid">
            {data?.categories?.map((c) => (
              <Link key={c._id} to={`/products?category=${c._id}`} className="card card--hoverable category-pill">
                <div className="category-pill__icon">{CATEGORY_ICON_LETTER(c.name)}</div>
                <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Offers ---------- */}
      {(loading || data?.offers?.length > 0) && (
        <div className="store-section">
          <div className="store-section__header">
            <span className="store-section__title">Special Offers</span>
            <Link to="/products" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          <div className="product-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={280} borderRadius={16} />)
              : data.offers.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}

      {/* ---------- Featured ---------- */}
      <div className="store-section">
        <div className="store-section__header">
          <span className="store-section__title">Featured Products</span>
          <Link to="/products" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            View All
          </Link>
        </div>
        <div className="product-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={280} borderRadius={16} />)
          ) : data?.featured?.length ? (
            data.featured.map((p) => <ProductCard key={p._id} product={p} />)
          ) : (
            <div className="empty-state">No featured products yet</div>
          )}
        </div>
      </div>

      {/* ---------- Best Sellers / Trending ---------- */}
      <div className="store-section">
        <div className="store-section__header">
          <span className="store-section__title">Best Sellers</span>
          <Link to="/products?sort=sold-desc" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            View All
          </Link>
        </div>
        <div className="product-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={280} borderRadius={16} />)
            : data?.trending?.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>

      {/* ---------- Recently Added ---------- */}
      <div className="store-section">
        <div className="store-section__header">
          <span className="store-section__title">Recently Added</span>
          <Link to="/products?sort=newest" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            View All
          </Link>
        </div>
        <div className="product-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={280} borderRadius={16} />)
            : data?.recentlyAdded?.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>

      {/* ---------- About ---------- */}
      <div className="card panel" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="panel__header">
          <span className="panel__title">About Our Shop</span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.7 }}>
          Campus Stationery is your on-campus supply shop, stocking everything from notebooks and pens
          to calculators and art supplies. Order online for quick pickup between classes, or stop by
          our counter in person — either way, we keep prices student-friendly and stock fresh.
        </p>
      </div>
    </div>
  );
};

export default Home;
