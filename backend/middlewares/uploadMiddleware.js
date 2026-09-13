const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only JPEG, PNG, and WEBP images are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5MB per file, max 6 files
});

// Single image (category)
const uploadSingleImage = upload.single('image');

// Multiple images (product gallery)
const uploadMultipleImages = upload.array('images', 6);

module.exports = { uploadSingleImage, uploadMultipleImages };
