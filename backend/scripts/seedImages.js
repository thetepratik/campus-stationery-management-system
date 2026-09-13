require('dotenv').config();
const fs = require('fs');
const path = require('path');

const Product = require('../models/Product');
const Category = require('../models/Category');
const connectDB = require('../config/db');

const PRODUCTS_DIR = path.join(__dirname, '..', 'uploads', 'products');
const CATEGORIES_DIR = path.join(__dirname, '..', 'uploads', 'Categories');

// A valid 1x1 JPEG, used only as a last-resort fallback for the handful of
// seeded products/categories that don't have a matching real sample photo.
const PLACEHOLDER_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

// Explicit product-name -> sample-photo mapping (built by matching the
// actual seeded product catalog in scripts/seed.js against the real photos
// available in backend/uploads/). Falls back to the placeholder pixel for
// the few products without a good real-photo match.
const PRODUCT_IMAGE_MAP = {
  'Ruled Notebook 200 Pages': 'Classmate Ruled Notebook 200 Pages.jpg',
  'Long Notebook 172 Pages': 'Camlin Long Notebook.jpg',
  'Graph Notebook': 'notebooks_1.jpg',
  'Blue Ball Pen (Pack of 5)': 'pen.jpg',
  'Black Gel Pen': 'pen.jpg',
  'Fluorescent Highlighter Set': 'pencil.png',
  'Plastic File Folder': 'file and folder.jpg',
  'Ring Binder File': 'file and folder.jpg',
  'Scientific Calculator FX-991': 'calculator.jpg',
  'Geometry Box': 'geometry box.jpg',
  'Sketch Book A4': 'Classmate Ruled Notebook 100 Pages.jpg',
  'Whitener Pen': 'pen.jpg',
  // No real photo available for these — placeholder used instead:
  // 'Stapler Small', 'A3 Chart Paper (Pack of 10)', 'Watercolor Set 12 Shades'
};

const CATEGORY_IMAGE_MAP = {
  Books: 'classmate notebook.jpg',
  Pens: 'pen.jpg',
  Files: 'file and folder.jpg',
  Accessories: 'office supplies.jpg',
  Drawing: 'arts and crafts.jpg',
};

const contentTypeFor = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

const loadImageBuffer = (dir, filename) => {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
};

const placeholderBuffer = Buffer.from(PLACEHOLDER_IMAGE_BASE64, 'base64');

const buildImageDoc = (buffer, contentType, fileName) => ({
  data: buffer,
  contentType,
  fileName,
  size: buffer.length,
  uploadedAt: new Date(),
});

const seedImages = async () => {
  try {
    await connectDB();
    console.log('[Seed Images] Connected. Attaching real sample photos where available...\n');

    const products = await Product.find({});
    let realPhotoCount = 0;
    let placeholderCount = 0;

    for (const product of products) {
      const mappedFile = PRODUCT_IMAGE_MAP[product.name];
      const buffer = mappedFile ? loadImageBuffer(PRODUCTS_DIR, mappedFile) : null;

      if (buffer) {
        product.images = [buildImageDoc(buffer, contentTypeFor(mappedFile), mappedFile)];
        realPhotoCount++;
        console.log(`[Seed Images] ${product.name} -> ${mappedFile} (real photo, ${buffer.length} bytes)`);
      } else {
        product.images = [buildImageDoc(placeholderBuffer, 'image/jpeg', `${product.slug}-placeholder.jpg`)];
        placeholderCount++;
        console.log(`[Seed Images] ${product.name} -> placeholder (no matching sample photo)`);
      }

      await product.save();
    }

    const categories = await Category.find({});
    let catRealCount = 0;
    let catPlaceholderCount = 0;

    for (const category of categories) {
      const mappedFile = CATEGORY_IMAGE_MAP[category.name];
      const buffer = mappedFile ? loadImageBuffer(CATEGORIES_DIR, mappedFile) : null;

      if (buffer) {
        category.image = buildImageDoc(buffer, contentTypeFor(mappedFile), mappedFile);
        catRealCount++;
        console.log(`[Seed Images] Category ${category.name} -> ${mappedFile} (real photo)`);
      } else {
        category.image = buildImageDoc(placeholderBuffer, 'image/jpeg', `${category.slug}-placeholder.jpg`);
        catPlaceholderCount++;
        console.log(`[Seed Images] Category ${category.name} -> placeholder`);
      }

      await category.save();
    }

    console.log(`\n[Seed Images] Done!`);
    console.log(`[Seed Images]   Products: ${realPhotoCount} real photos, ${placeholderCount} placeholders (${products.length} total)`);
    console.log(`[Seed Images]   Categories: ${catRealCount} real photos, ${catPlaceholderCount} placeholders (${categories.length} total)`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Images] Error:', error);
    process.exit(1);
  }
};

seedImages();
