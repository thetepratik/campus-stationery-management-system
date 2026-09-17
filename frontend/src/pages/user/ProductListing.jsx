import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import {
  FiSearch,
  FiSliders,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';

import { storeApi } from '../../services/storeApi';
import { categoryApi } from '../../services/categoryApi';
import useDebounce from '../../hooks/useDebounce';
import ProductCard from '../../components/user/ProductCard';
import Pagination from '../../components/common/Pagination';
import FilterDrawer from '../../components/user/FilterDrawer';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'newest', label: 'Newest' },
];

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);

  // Filter Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // URL parameters
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const availability = searchParams.get('availability') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const page = Number(searchParams.get('page')) || 1;

  // Metadata
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Results
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Categories & Brands
  useEffect(() => {
    let mounted = true;
    Promise.all([
      categoryApi.list().catch(() => ({ data: { categories: [] } })),
      storeApi.getBrands().catch(() => ({ data: { brands: [] } }))
    ]).then(([catRes, brandRes]) => {
      if (mounted) {
        setCategories(catRes?.data?.categories || []);
        setBrands(brandRes?.data?.brands || []);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync debounced search to URL
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

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await storeApi.listProducts({
        search: debouncedSearch.trim(),
        category,
        brand,
        minPrice,
        maxPrice,
        availability,
        sort,
        page,
        limit: 12,
      });
      setProducts(res.data.products || []);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Unable to load products.');
      toast.error(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, brand, minPrice, maxPrice, availability, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update a single URL query param
  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  // Pagination helper
  const updatePage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    }, { replace: true });
  };

  // Drawer apply
  const handleApplyDrawer = (draft) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ['category', 'brand', 'minPrice', 'maxPrice', 'availability', 'sort'].forEach((key) => {
        if (draft[key]) next.set(key, draft[key]);
        else next.delete(key);
      });
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearch('');
    setSearchParams({ sort: 'relevance', page: '1' });
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (category) {
      const cObj = categories.find((c) => c._id === category);
      chips.push({ key: 'category', label: `Category: ${cObj ? cObj.name : 'Selected'}` });
    }
    if (brand) {
      chips.push({ key: 'brand', label: `Brand: ${brand}` });
    }
    if (minPrice || maxPrice) {
      const min = minPrice ? `₹${minPrice}` : '₹0';
      const max = maxPrice ? `₹${maxPrice}` : 'Above';
      chips.push({ key: 'price', label: `Price: ${min} - ${max}` });
    }
    if (availability) {
      const map = { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' };
      chips.push({ key: 'availability', label: `Stock: ${map[availability] || availability}` });
    }
    if (search.trim()) {
      chips.push({ key: 'search', label: `Search: "${search.trim()}"` });
    }
    return chips;
  }, [category, brand, minPrice, maxPrice, availability, search, categories]);

  const handleRemoveChip = (key) => {
    if (key === 'search') {
      setSearch('');
      updateParam('search', '');
    } else if (key === 'price') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('minPrice');
        next.delete('maxPrice');
        next.set('page', '1');
        return next;
      }, { replace: true });
    } else {
      updateParam(key, '');
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (category) count++;
    if (brand) count++;
    if (minPrice || maxPrice) count++;
    if (availability) count++;
    return count;
  }, [category, brand, minPrice, maxPrice, availability]);

  const totalCount = meta?.totalCount ?? products.length;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Browse Stationery
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Explore all study essentials, books, notebooks, pens, and college supplies
        </p>
      </div>

      {/* Integrated Search & Filter Bar */}
      <div className="store-search-bar">
        <div className="store-search-bar__input-wrap">
          <FiSearch className="store-search-bar__icon" />
          <input
            type="text"
            className="store-search-bar__input"
            placeholder="Search for notebooks, pens, calculators, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          {search && (
            <button
              type="button"
              className="store-search-bar__clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="store-search-bar__filter-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open filter drawer"
          >
            <FiSliders size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="store-search-bar__filter-badge">{activeFilterCount}</span>
            )}
          </button>

          <select
            className="store-search-bar__sort-select"
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            aria-label="Sort products by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort by: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="active-filters-bar" aria-label="Active filters">
          {activeChips.map((chip) => (
            <span key={chip.key} className="filter-chip">
              {chip.label}
              <button
                type="button"
                className="filter-chip__remove"
                onClick={() => handleRemoveChip(chip.key)}
                aria-label={`Remove filter ${chip.label}`}
              >
                <FiX size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="filter-chip filter-chip--clear-all"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Product Count */}
      <div className="product-count-label">
        {loading
          ? 'Searching products...'
          : activeChips.length > 0
          ? `${totalCount} ${totalCount === 1 ? 'product' : 'products'} found`
          : `Showing all ${totalCount} products`}
      </div>

      {/* Products Grid / Loading / Empty / Error States */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 'var(--space-4)' }}>
              <Skeleton height={180} borderRadius={12} style={{ marginBottom: 12 }} />
              <Skeleton height={20} width="80%" style={{ marginBottom: 8 }} />
              <Skeleton height={16} width="40%" style={{ marginBottom: 12 }} />
              <Skeleton height={32} borderRadius={20} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state card" style={{ padding: 'var(--space-12)' }}>
          <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error}</p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>Check your connection and try again.</p>
          <button
            className="btn btn--primary btn--sm flex items-center gap-2"
            onClick={fetchProducts}
            style={{ marginTop: 'var(--space-2)' }}
          >
            <FiRefreshCw size={14} /> Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state card" style={{ padding: 'var(--space-12)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>No products match your search</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Try adjusting your search terms, changing price limits, or clearing filters.
          </p>
          <button
            className="btn btn--primary btn--sm"
            onClick={handleClearAll}
            style={{ marginTop: 'var(--space-3)' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-8)' }}>
            <Pagination meta={meta} onPageChange={updatePage} />
          </div>
        </>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        brands={brands}
        filters={{ category, brand, minPrice, maxPrice, availability, sort }}
        onApply={handleApplyDrawer}
        onClear={handleClearAll}
      />
    </div>
  );
};

export default ProductListing;
