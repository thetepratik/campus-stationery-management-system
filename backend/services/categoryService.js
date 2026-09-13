const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { slugify } = require('../utils/generateId');
const { serializeDocument } = require('../utils/imageUtils');

const listCategories = async () => {
  const categories = await Category.find({}).sort({ createdAt: -1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return categories.map((c) => ({ ...serializeDocument(c), productCount: countMap.get(c._id.toString()) || 0 }));
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return serializeDocument(category);
};

const createCategory = async ({ name, description }, file) => {
  const slug = slugify(name);
  const existing = await Category.findOne({ $or: [{ name }, { slug }] });
  if (existing) throw new ApiError(409, 'A category with this name already exists');

  const imageData = file
    ? {
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.originalname,
    }
    : null;

  const category = await Category.create({ name, slug, description, image: imageData });
  return serializeDocument(category);
};

const updateCategory = async (id, { name, description, isActive }, file) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (name && name !== category.name) {
    const slug = slugify(name);
    const clash = await Category.findOne({ _id: { $ne: id }, $or: [{ name }, { slug }] });
    if (clash) throw new ApiError(409, 'A category with this name already exists');
    category.name = name;
    category.slug = slug;
  }

  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  if (file) {
    category.image = {
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.originalname,
    };
  }

  await category.save();
  return serializeDocument(category);
};

const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete "${category.name}" — ${productCount} product(s) are still assigned to it. Reassign or delete them first.`
    );
  }
  await category.deleteOne();
  return serializeDocument(category);
};

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
