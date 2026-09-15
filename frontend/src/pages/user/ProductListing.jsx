import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { FiSearch } from 'react-icons/fi';

import { storeApi } from '../../services/storeApi';
import { categoryApi } from '../../services/categoryApi';
import useDebounce from '../../hooks/useDebounce';
import ProductCard from '../../components/user/ProductCard';
import Pagination from '../../components/common/Pagination';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'sold-desc', label: 'Best Selling' },
  { value: 'name-asc', label: 'Name: A-Z' },
];

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);

  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storeApi.listProducts({ search: debouncedSearch, category, sort, page, limit: 12 });
      setProducts(res.data.products);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (debouncedSearch !== currentSearch) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) next.set('search', debouncedSearch);
        else next.delete('search');
        next.set('page', '1');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const updatePage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    }, { replace: true });
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-5)' }}>Browse Products</h1>

      <div className="flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <div className="user-navbar__search" style={{ width: 280, background: 'var(--color-bg)' }}>
          <FiSearch size={16} />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 200 }} value={category} onChange={(e) => updateParam('category', e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select className="form-select" style={{ width: 200 }} value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={280} borderRadius={16} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state card" style={{ padding: 'var(--space-12)' }}>No products match your search</div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Pagination meta={meta} onPageChange={updatePage} />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListing;
