import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

import { productApi } from '../../services/productApi';
import { categoryApi } from '../../services/categoryApi';
import useDebounce from '../../hooks/useDebounce';

import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import ProductFilters from '../../components/admin/products/ProductFilters';
import ProductTable from '../../components/admin/products/ProductTable';
import ProductFormModal from '../../components/admin/products/ProductFormModal';
import BulkActionsBar from '../../components/admin/products/BulkActionsBar';
import CategoryGrid from '../../components/admin/categories/CategoryGrid';
import CategoryFormModal from '../../components/admin/categories/CategoryFormModal';

const DEFAULT_FILTERS = { search: '', category: '', status: '', availability: '', sort: 'newest', page: 1 };

const Products = () => {
  const [tab, setTab] = useState('products');

  // Shared category & brand data (used by product filters/forms and the categories tab)
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brands, setBrands] = useState([]);

  // Products tab state
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Categories tab state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await categoryApi.list();
      setCategories(res.data.categories);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await productApi.getBrands();
      setBrands(res.data.brands || []);
    } catch {
      // Ignore brand fetch error
    }
  }, []);


  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await productApi.list({ ...filters, search: debouncedSearch });
      setProducts(res.data.products);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProductsLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  useEffect(() => {
    fetchProducts();
    setSelectedIds([]);
  }, [fetchProducts]);

  // ---------- Product handlers ----------
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleToggleSelectAll = (checked) => {
    setSelectedIds(checked ? products.map((p) => p._id) : []);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)? This cannot be undone.`)) return;
    try {
      const res = await productApi.bulkDelete(selectedIds);
      toast.success(res.message);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      const res = await productApi.bulkUpdateStatus(selectedIds, status);
      toast.success(res.message);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkPrice = async (mode, value) => {
    try {
      const res = await productApi.bulkPriceUpdate(selectedIds, mode, value);
      toast.success(res.message);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      await productApi.remove(deleteTarget._id);
      toast.success('Product deleted successfully');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Category handlers ----------
  const handleDeleteCategory = async () => {
    setDeletingCategory(true);
    try {
      await categoryApi.remove(deleteCategoryTarget._id);
      toast.success('Category deleted successfully');
      setDeleteCategoryTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingCategory(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="auth-role-toggle" style={{ width: 280, marginBottom: 0 }}>
          <a className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')} style={{ cursor: 'pointer' }}>
            Products
          </a>
          <a className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')} style={{ cursor: 'pointer' }}>
            Categories
          </a>
        </div>

        {tab === 'products' ? (
          <Button onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}>
            <FiPlus size={16} /> Add Product
          </Button>
        ) : (
          <Button onClick={() => { setEditingCategory(null); setCategoryModalOpen(true); }}>
            <FiPlus size={16} /> Add Category
          </Button>
        )}
      </div>

      {tab === 'products' ? (
        <div className="card panel">
          <ProductFilters
            filters={filters}
            onChange={setFilters}
            categories={categories}
            brands={brands}
          />

          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
          >
            <span>
              {productsLoading
                ? 'Loading catalog...'
                : `Showing ${meta?.totalCount ?? products.length} products`}
            </span>
          </div>

          <BulkActionsBar
            selectedCount={selectedIds.length}
            onClear={() => setSelectedIds([])}
            onBulkDelete={handleBulkDelete}
            onBulkStatus={handleBulkStatus}
            onBulkPrice={handleBulkPrice}
          />

          {productsLoading ? (
            <Skeleton height={48} count={6} style={{ marginBottom: 8 }} />
          ) : (
            <>
              <ProductTable
                products={products}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onEdit={(p) => { setEditingProduct(p); setProductModalOpen(true); }}
                onDelete={(p) => setDeleteTarget(p)}
              />
              <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
            </>
          )}
        </div>
      ) : (
        <div className="card panel">
          {categoriesLoading ? (
            <Skeleton height={180} count={3} style={{ marginBottom: 8 }} />
          ) : (
            <CategoryGrid
              categories={categories}
              onEdit={(c) => { setEditingCategory(c); setCategoryModalOpen(true); }}
              onDelete={(c) => setDeleteCategoryTarget(c)}
            />
          )}
        </div>
      )}

      <ProductFormModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSaved={fetchProducts}
        product={editingProduct}
        categories={categories}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <CategoryFormModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSaved={fetchCategories}
        category={editingCategory}
      />
      <ConfirmDialog
        open={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
        loading={deletingCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteCategoryTarget?.name}"? Products using it must be reassigned or removed first.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Products;
