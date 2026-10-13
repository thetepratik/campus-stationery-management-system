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

// Single image (category, admin avatar, or shop logo)
const singleUploadHandler = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);

const uploadSingleImage = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  singleUploadHandler(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files.logo?.[0] || req.files.image?.[0] || req.files.avatar?.[0] || null;
    }
    next();
  });
};

// Multiple images (product gallery)
const uploadMultipleImages = upload.array('images', 6);

module.exports = { uploadSingleImage, uploadMultipleImages };
