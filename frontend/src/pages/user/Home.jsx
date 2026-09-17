import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import {
  FiSearch,
  FiSliders,
  FiX,
  FiArrowRight,
  FiTruck,
  FiShield,
  FiSmile,
  FiStar,
  FiTag,
  FiCheckCircle,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw
} from 'react-icons/fi';

import { storeApi } from '../../services/storeApi';
import { categoryApi } from '../../services/categoryApi';
import useDebounce from '../../hooks/useDebounce';
import ProductCard from '../../components/user/ProductCard';
import FilterDrawer from '../../components/user/FilterDrawer';
import HeroIllustration from '../../components/user/HeroIllustration';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'newest', label: 'Newest' },
];

const DEFAULT_FILTERS = {
  category: '',
  brand: '',
  minPrice: '',
  maxPrice: '',
  availability: '',
  sort: 'relevance',
};

const HERO_SLIDES = [
  {
    badge: 'GEAR UP FOR SUCCESS',
    titleMain: 'Everything You Need',
    titleHighlight: 'College Journey',
    subtitle: 'Quality stationery, study essentials and more — all in one place, at great prices.',
    ctaText: 'Shop Now',
    ctaLink: '/products',
  },
  {
    badge: 'EXAM & LAB ESSENTIALS',
    titleMain: 'Aces Your Exams With',
    titleHighlight: 'Top Supplies',
    subtitle: 'Calculators, lab journals, engineering instruments and quick campus pickup.',
    ctaText: 'Explore Catalog',
    ctaLink: '/products',
  },
];

const Home = () => {
  const navigate = useNavigate();

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data state
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch metadata: Categories & Brands
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

  // Fetch Products matching search + filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: 12,
        search: debouncedSearch.trim(),
        category: filters.category,
        brand: filters.brand,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        availability: filters.availability,
        sort: filters.sort,
      };

      const res = await storeApi.listProducts(params);
      setProducts(res.data.products || []);
      setTotalCount(res.meta?.totalCount ?? res.data.products?.length ?? 0);
    } catch (err) {
      setError(err.message || 'Unable to load products.');
      toast.error(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Compute Active Filter Chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.category) {
      const catObj = categories.find((c) => c._id === filters.category);
      chips.push({
        key: 'category',
        label: `Category: ${catObj ? catObj.name : 'Selected'}`,
      });
    }
    if (filters.brand) {
      chips.push({
        key: 'brand',
        label: `Brand: ${filters.brand}`,
      });
    }
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? `₹${filters.minPrice}` : '₹0';
      const max = filters.maxPrice ? `₹${filters.maxPrice}` : 'Above';
      chips.push({
        key: 'price',
        label: `Price: ${min} - ${max}`,
      });
    }
    if (filters.availability) {
      const labelMap = {
        'in-stock': 'In Stock',
        'low-stock': 'Low Stock',
        'out-of-stock': 'Out of Stock',
      };
      chips.push({
        key: 'availability',
        label: `Stock: ${labelMap[filters.availability] || filters.availability}`,
      });
    }
    if (debouncedSearch.trim()) {
      chips.push({
        key: 'search',
        label: `Search: "${debouncedSearch.trim()}"`,
      });
    }
    return chips;
  }, [filters, categories, debouncedSearch]);

  const handleRemoveChip = (key) => {
    if (key === 'search') {
      setSearchTerm('');
    } else if (key === 'price') {
      setFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '' }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilters(DEFAULT_FILTERS);
  };

  const handleApplyDrawer = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.brand) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.availability) count++;
    return count;
  }, [filters]);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
      {/* ============================================================
          1. HERO SECTION
          ============================================================ */}
      <section className="hero-banner" aria-label="CampusKart Featured Banner">
        {/* Carousel Arrow Left */}
        <button
          className="hero-banner__nav-arrow hero-banner__nav-arrow--prev"
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
          aria-label="Previous slide"
        >
          <FiChevronLeft size={20} />
        </button>

        {/* Carousel Arrow Right */}
        <button
          className="hero-banner__nav-arrow hero-banner__nav-arrow--next"
          onClick={() => setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1))}
          aria-label="Next slide"
        >
          <FiChevronRight size={20} />
        </button>

        <div className="hero-banner__inner">
          {/* Left Text & CTA */}
          <div className="hero-banner__content">
            <div className="hero-banner__badge">
              <span>{activeSlide.badge}</span>
            </div>

            <h1 className="hero-banner__title">
              {activeSlide.titleMain} for Your{' '}
              <span className="hero-banner__highlight">{activeSlide.titleHighlight}</span>
            </h1>

            <p className="hero-banner__subtitle">{activeSlide.subtitle}</p>

            <Link to={activeSlide.ctaLink} className="hero-banner__cta-btn">
              {activeSlide.ctaText} <FiArrowRight size={16} />
            </Link>

            {/* Small trust points with icons */}
            <div className="hero-banner__trust-row">
              <div className="hero-banner__trust-item">
                <FiTruck className="hero-banner__trust-icon" />
                <span>Fast & Reliable</span>
              </div>
              <div className="hero-banner__trust-item">
                <FiShield className="hero-banner__trust-icon" />
                <span>Secure Payments</span>
              </div>
              <div className="hero-banner__trust-item">
                <FiHeart className="hero-banner__trust-icon" />
                <span>Trusted by Students</span>
              </div>
            </div>
          </div>

          {/* Right Vector Illustration */}
          <HeroIllustration />
        </div>

        {/* Carousel Dots */}
        <div className="hero-banner__dots">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              className={`hero-banner__dot ${idx === currentSlide ? 'hero-banner__dot--active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ============================================================
          2. FEATURE CARDS (4 Compact cards)
          ============================================================ */}
      <section className="features-grid" aria-label="Store Key Features">
        <div className="feature-card">
          <div className="feature-card__icon-wrap feature-card__icon-wrap--purple">
            <FiTag />
          </div>
          <div>
            <div className="feature-card__title">Affordable Prices</div>
            <div className="feature-card__desc">Best value for students</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-card__icon-wrap feature-card__icon-wrap--green">
            <FiCheckCircle />
          </div>
          <div>
            <div className="feature-card__title">Quality Products</div>
            <div className="feature-card__desc">Trusted brands</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-card__icon-wrap feature-card__icon-wrap--blue">
            <FiTruck />
          </div>
          <div>
            <div className="feature-card__title">Quick Pickup</div>
            <div className="feature-card__desc">Ready at college store</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-card__icon-wrap feature-card__icon-wrap--pink">
            <FiHeart />
          </div>
          <div>
            <div className="feature-card__title">Student Friendly</div>
            <div className="feature-card__desc">Built for your needs</div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. POPULAR PRODUCTS (Search + Filter + Product-First Browsing)
          ============================================================ */}
      <section id="popular-products" className="product-browsing-section">
        {/* Section Title & View All */}
        <div className="product-browsing-header">
          <div>
            <h2 className="product-browsing-title">Popular Products</h2>
            <p className="product-browsing-subtitle">Best picks for your studies</p>
          </div>
          <Link to="/products" className="product-browsing-view-all">
            View All <FiArrowRight size={14} />
          </Link>
        </div>

        {/* Integrated Search & Filter Bar */}
        <div className="store-search-bar">
          <div className="store-search-bar__input-wrap">
            <FiSearch className="store-search-bar__icon" />
            <input
              type="text"
              className="store-search-bar__input"
              placeholder="Search for notebooks, pens, calculators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search products"
            />
            {searchTerm && (
              <button
                type="button"
                className="store-search-bar__clear"
                onClick={() => setSearchTerm('')}
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
              aria-label="Open filter options"
            >
              <FiSliders size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className="store-search-bar__filter-badge">{activeFilterCount}</span>
              )}
            </button>

            <select
              className="store-search-bar__sort-select"
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
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
              onClick={handleClearAllFilters}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Product Count Indicator */}
        <div className="product-count-label">
          {loading
            ? 'Loading products...'
            : activeChips.length > 0
            ? `${totalCount} ${totalCount === 1 ? 'product' : 'products'} found`
            : `Showing all ${totalCount} products`}
        </div>

        {/* Products Grid / Skeletons / Empty / Error States */}
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
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>No products found</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Try changing your search keywords or adjusting your filters.
            </p>
            <button
              className="btn btn--primary btn--sm"
              onClick={handleClearAllFilters}
              style={{ marginTop: 'var(--space-3)' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ============================================================
          4. PROMOTIONAL BANNERS
          ============================================================ */}
      <section className="promo-banners-grid" aria-label="Special Offers and Promotions">
        {/* Banner 1: Special Offer */}
        <div className="promo-banner promo-banner--offer">
          <div>
            <div className="promo-banner__tag">Special Offer</div>
            <h3 className="promo-banner__title">
              Up to 20% Off on Study Essentials
            </h3>
          </div>
          <Link to="/products?sort=price-asc" className="promo-banner__btn">
            Shop Now <FiArrowRight size={14} />
          </Link>
          <div className="promo-banner__badge">
            20%
            <span>OFF</span>
          </div>
        </div>

        {/* Banner 2: Exam Preparation */}
        <div className="promo-banner promo-banner--exams">
          <div>
            <div className="promo-banner__tag">Be Prepared</div>
            <h3 className="promo-banner__title">
              Everything for Exams & Projects
            </h3>
          </div>
          <Link to="/products" className="promo-banner__btn">
            Explore Now <FiArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ============================================================
          5. STUDENT TRUST & STATS SECTION
          ============================================================ */}
      <section className="trust-stats-grid" aria-label="CampusKart Trust Statistics">
        <div className="trust-stat-item">
          <FiSmile className="trust-stat-icon" />
          <div className="trust-stat-number">5,000+</div>
          <div className="trust-stat-label">Happy Students</div>
        </div>

        <div className="trust-stat-item">
          <FiShield className="trust-stat-icon" />
          <div className="trust-stat-number">100%</div>
          <div className="trust-stat-label">Secure Payments</div>
        </div>

        <div className="trust-stat-item">
          <FiTruck className="trust-stat-icon" />
          <div className="trust-stat-number">Fast</div>
          <div className="trust-stat-label">College Pickup</div>
        </div>

        <div className="trust-stat-item">
          <FiStar className="trust-stat-icon" />
          <div className="trust-stat-number">4.8 / 5</div>
          <div className="trust-stat-label">Student Rating</div>
        </div>
      </section>

      {/* ============================================================
          6. ABOUT & CONTACT SECTIONS (Navbar Anchor Targets)
          ============================================================ */}
      <section id="about-section" className="card panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="panel__header">
          <span className="panel__title">About CampusKart</span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.8 }}>
          CampusKart is your on-campus stationery and study supplies hub. We keep thousands of notebooks,
          technical pens, calculators, geometry sets, and art materials in stock for your academic journey.
          Order online via Razorpay and pick up your items at the campus store counter without standing in line.
        </p>
      </section>

      <section id="contact-section" className="card panel" style={{ marginBottom: 'var(--space-10)' }}>
        <div className="panel__header">
          <span className="panel__title">Contact & Campus Store Hours</span>
        </div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.8 }}>
          <div><strong>Store Location:</strong> Ground Floor, Student Activity Center (SAC)</div>
          <div><strong>Hours:</strong> Monday – Saturday: 8:30 AM – 6:30 PM</div>
          <div><strong>Support Email:</strong> support@campuskart.edu | Phone: Ext. 4201</div>
        </div>
      </section>

      {/* ============================================================
          FILTER DRAWER (Modal Sidebar)
          ============================================================ */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        brands={brands}
        filters={filters}
        onApply={handleApplyDrawer}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />
    </div>
  );
};

export default Home;
