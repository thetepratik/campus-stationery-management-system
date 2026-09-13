require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const PRODUCTS_IMG_DIR = path.join(__dirname, '..', 'uploads', 'products');
const CATEGORIES_IMG_DIR = path.join(__dirname, '..', 'uploads', 'Categories');

const PLACEHOLDER_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
const placeholderBuffer = Buffer.from(PLACEHOLDER_IMAGE_BASE64, 'base64');

const contentTypeFor = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

const buildImageDoc = (buffer, contentType, fileName) => ({
  data: buffer,
  contentType,
  fileName,
  size: buffer.length,
  uploadedAt: new Date(),
});

const normalize = (str) =>
  (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const STOPWORDS = new Set(['pack', 'of', 'the', 'a', 'an', 'set', 'small', 'large', 'and']);

const significantWords = (str) =>
  normalize(str)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

/**
 * Finds the best-matching file in `dir` for a given product/category name by
 * counting overlapping significant words between the name and each
 * candidate filename. Returns null if nothing scores above zero.
 */
const findBestMatch = (dir, name) => {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const nameWords = new Set(significantWords(name));
  if (!nameWords.size) return null;

  let best = null;
  let bestScore = 0;
  for (const file of files) {
    const fileWords = significantWords(path.basename(file, path.extname(file)));
    const overlap = fileWords.filter((w) => nameWords.has(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      best = file;
    }
  }
  return bestScore > 0 ? best : null;
};

const hasRealImage = (imageDoc) => {
  if (!imageDoc) return false;
  if (Array.isArray(imageDoc)) return imageDoc.length > 0 && imageDoc.every((i) => i && i.data);
  return !!imageDoc.data;
};

const run = async () => {
  await connectDB();
  console.log('[Backfill] Connected. Scanning for products/categories with missing images...\n');

  const products = await Product.find({});
  let productsFixed = 0;
  let productsAlreadyOk = 0;
  let productsPlaceholder = 0;

  for (const product of products) {
    if (hasRealImage(product.images)) {
      productsAlreadyOk++;
      continue;
    }

    const match = findBestMatch(PRODUCTS_IMG_DIR, product.name);
    if (match) {
      const buffer = fs.readFileSync(path.join(PRODUCTS_IMG_DIR, match));
      product.images = [buildImageDoc(buffer, contentTypeFor(match), match)];
      productsFixed++;
      console.log(`[Backfill] FIXED "${product.name}" -> ${match} (keyword match)`);
    } else {
      product.images = [buildImageDoc(placeholderBuffer, 'image/jpeg', `${product.slug || product._id}-placeholder.jpg`)];
      productsPlaceholder++;
      console.log(`[Backfill] "${product.name}" -> no photo match found, used placeholder`);
    }
    await product.save();
  }

  const categories = await Category.find({});
  let categoriesFixed = 0;
  let categoriesAlreadyOk = 0;
  let categoriesPlaceholder = 0;

  for (const category of categories) {
    if (hasRealImage(category.image)) {
      categoriesAlreadyOk++;
      continue;
    }

    const match = findBestMatch(CATEGORIES_IMG_DIR, category.name);
    if (match) {
      const buffer = fs.readFileSync(path.join(CATEGORIES_IMG_DIR, match));
      category.image = buildImageDoc(buffer, contentTypeFor(match), match);
      categoriesFixed++;
      console.log(`[Backfill] Category "${category.name}" -> ${match} (keyword match)`);
    } else {
      category.image = buildImageDoc(placeholderBuffer, 'image/jpeg', `${category.slug || category._id}-placeholder.jpg`);
      categoriesPlaceholder++;
      console.log(`[Backfill] Category "${category.name}" -> no photo match found, used placeholder`);
    }
    await category.save();
  }

  console.log(`\n[Backfill] Done!`);
  console.log(`[Backfill]   Products: ${productsAlreadyOk} already had images, ${productsFixed} fixed with a real matched photo, ${productsPlaceholder} given a placeholder (${products.length} total)`);
  console.log(`[Backfill]   Categories: ${categoriesAlreadyOk} already had images, ${categoriesFixed} fixed, ${categoriesPlaceholder} given a placeholder (${categories.length} total)`);

  process.exit(0);
};

run().catch((err) => {
  console.error('[Backfill] Error:', err);
  process.exit(1);
});
