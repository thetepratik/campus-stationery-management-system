import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import ImageUploader from '../../common/ImageUploader';
import { categoryApi } from '../../../services/categoryApi';

const CategoryFormModal = ({ open, onClose, onSaved, category }) => {
  const isEdit = !!category;
  const [file, setFile] = useState(null);
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
        name: category?.name || '',
        description: category?.description || '',
      });
      setFile(null);
    }
  }, [open, category, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await categoryApi.update(category._id, data, file);
        toast.success('Category updated successfully');
      } else {
        await categoryApi.create(data, file);
        toast.success('Category created successfully');
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          id="name"
          label="Category Name"
          placeholder="e.g. Books"
          error={errors.name?.message}
          register={register('name', { required: 'Category name is required' })}
        />
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description (optional)</label>
          <textarea id="description" className="form-textarea" rows={3} {...register('description')} />
        </div>
        <ImageUploader
          multiple={false}
          files={file}
          onChange={setFile}
          existingUrls={!file && category?.image ? [category.image] : []}
        />
        <div className="flex gap-3 justify-end" style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
