const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const categoryService = require('../services/categoryService');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  success(res, 200, 'Categories fetched', { categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  success(res, 200, 'Category fetched', { category });
});

const getCategoryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const image = await categoryService.getCategoryImage(id);
  if (!image || !image.data) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  res.set('Content-Type', image.contentType || 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=86400, immutable');
  const buffer = Buffer.isBuffer(image.data)
    ? image.data
    : Buffer.from(image.data.buffer || image.data);
  return res.send(buffer);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, req.file);
  success(res, 201, 'Category created successfully', { category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body, req.file);
  success(res, 200, 'Category updated successfully', { category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  success(res, 200, 'Category deleted successfully');
});

module.exports = { listCategories, getCategory, getCategoryImage, createCategory, updateCategory, deleteCategory };
