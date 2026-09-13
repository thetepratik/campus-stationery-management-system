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

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
