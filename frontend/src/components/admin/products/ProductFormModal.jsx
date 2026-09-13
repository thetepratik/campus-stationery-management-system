import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Button from '../../common/Button';
import ImageUploader from '../../common/ImageUploader';
import { productApi } from '../../../services/productApi';

const ProductFormModal = ({ open, onClose, onSaved, product, categories = [] }) => {
  const isEdit = !!product;
  const [files, setFiles] = useState([]);
  const [removedExisting, setRemovedExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name || '',
        category: product?.category?._id || product?.category || '',
        brand: product?.brand || '',
        supplier: product?.supplier || '',
        description: product?.description || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        purchasePrice: product?.purchasePrice ?? '',
        sellingPrice: product?.sellingPrice ?? '',
        discountPercent: product?.discountPercent ?? 0,
        gstPercent: product?.gstPercent ?? 0,
        openingStock: product?.openingStock ?? '',
        currentStock: product?.currentStock ?? '',
        minStock: product?.minStock ?? 10,
        maxStock: product?.maxStock ?? 500,
        status: product?.status || 'active',
      });
      setFiles([]);
      setRemovedExisting(false);
    }
  }, [open, product, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (isEdit && removedExisting) payload.removeAllImages = 'true';
      // opening stock is immutable once a product exists (currentStock is the editable figure)
      if (isEdit) delete payload.openingStock;

      if (isEdit) {
        await productApi.update(product._id, payload, files);
        toast.success('Product updated successfully');
      } else {
        await productApi.create(payload, files);
        toast.success('Product created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} maxWidth={680}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
          <Input
            id="name"
            label="Product Name"
            placeholder="e.g. Ruled Notebook 200 Pages"
            error={errors.name?.message}
            register={register('name', { required: 'Product name is required' })}
          />
          <Select
            id="category"
            label="Category"
            placeholder="Select a category"
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
            error={errors.category?.message}
            register={register('category', { required: 'Category is required' })}
          />
          <Input id="brand" label="Brand" placeholder="e.g. Classmate" register={register('brand')} />
          <Input id="supplier" label="Supplier" placeholder="e.g. Classmate Distributors" register={register('supplier')} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea id="description" className="form-textarea" rows={3} {...register('description')} />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
          <Input id="sku" label="SKU (auto-generated if blank)" placeholder="SKU-XXXXXX" register={register('sku')} />
          <Input id="barcode" label="Barcode (auto-generated if blank)" register={register('barcode')} />

          <Input
            id="purchasePrice"
            label="Purchase Price (₹)"
            type="number"
            step="0.01"
            error={errors.purchasePrice?.message}
            register={register('purchasePrice', { required: 'Required', min: { value: 0, message: 'Must be positive' } })}
          />
          <Input
            id="sellingPrice"
            label="Selling Price (₹)"
            type="number"
            step="0.01"
            error={errors.sellingPrice?.message}
            register={register('sellingPrice', { required: 'Required', min: { value: 0, message: 'Must be positive' } })}
          />
          <Input id="discountPercent" label="Discount (%)" type="number" step="0.01" register={register('discountPercent')} />
          <Input id="gstPercent" label="GST (%)" type="number" step="0.01" register={register('gstPercent')} />

          {isEdit ? (
            <Input
              id="currentStock"
              label="Current Stock"
              type="number"
              hint="Editing this directly bypasses the inventory ledger — prefer Restock in Inventory (Phase 5)."
              register={register('currentStock')}
            />
          ) : (
            <Input
              id="openingStock"
              label="Opening Stock"
              type="number"
              error={errors.openingStock?.message}
              register={register('openingStock', { required: 'Required', min: { value: 0, message: 'Must be non-negative' } })}
            />
          )}
          <Input id="minStock" label="Minimum Stock" type="number" register={register('minStock')} />
          <Input id="maxStock" label="Maximum Stock" type="number" register={register('maxStock')} />

          <Select
            id="status"
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            register={register('status')}
          />
        </div>

        <ImageUploader
          multiple
          files={files}
          onChange={setFiles}
          existingUrls={removedExisting ? [] : product?.images || []}
          onRemoveExisting={() => setRemovedExisting(true)}
        />

        <div className="flex gap-3 justify-end" style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
