const { Binary } = require('mongodb');

/**
 * Convert different MongoDB/Mongoose image formats
 * into a browser-compatible Base64 data URL.
 */
const toBase64DataUrl = (value) => {
  if (!value) {
    return '';
  }

  /* ---------------------------------------------------------
     Already a string
  --------------------------------------------------------- */
  if (typeof value === 'string') {
    return value;
  }

  /* ---------------------------------------------------------
     Direct Node.js Buffer
  --------------------------------------------------------- */
  if (Buffer.isBuffer(value)) {
    return `data:image/jpeg;base64,${value.toString('base64')}`;
  }

  /* ---------------------------------------------------------
     MongoDB Binary
  --------------------------------------------------------- */
  if (value instanceof Binary) {
    const buffer = Buffer.from(value.buffer);

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  /* ---------------------------------------------------------
     MongoDB serialized Buffer

     {
       type: "Buffer",
       data: [...]
     }
  --------------------------------------------------------- */
  if (
    value.type === 'Buffer' &&
    Array.isArray(value.data)
  ) {
    const buffer = Buffer.from(value.data);

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  /* ---------------------------------------------------------
     Product image object

     {
       data: Buffer,
       contentType: "image/png",
       fileName: "...",
       size: ...
     }
  --------------------------------------------------------- */
  if (
    typeof value === 'object' &&
    value.data !== undefined
  ) {
    const mime =
      value.contentType || 'image/jpeg';

    const imageData = value.data;

    /* Buffer */
    if (Buffer.isBuffer(imageData)) {
      return `data:${mime};base64,${imageData.toString('base64')}`;
    }

    /* MongoDB Binary */
    if (imageData instanceof Binary) {
      const buffer = Buffer.from(imageData.buffer);

      return `data:${mime};base64,${buffer.toString('base64')}`;
    }

    /* Serialized Buffer */
    if (
      imageData &&
      imageData.type === 'Buffer' &&
      Array.isArray(imageData.data)
    ) {
      const buffer = Buffer.from(imageData.data);

      return `data:${mime};base64,${buffer.toString('base64')}`;
    }

    /* Array of bytes */
    if (Array.isArray(imageData)) {
      const buffer = Buffer.from(imageData);

      return `data:${mime};base64,${buffer.toString('base64')}`;
    }

    /* Base64 string */
    if (typeof imageData === 'string') {
      return `data:${mime};base64,${imageData}`;
    }

    /* Object containing Binary */
    if (
      imageData &&
      typeof imageData === 'object' &&
      imageData.buffer
    ) {
      try {
        const buffer = Buffer.from(imageData.buffer);

        return `data:${mime};base64,${buffer.toString('base64')}`;
      } catch (error) {
        // Ignore invalid image buffer
      }
    }
  }

  /* ---------------------------------------------------------
     Image URL object
  --------------------------------------------------------- */
  if (
    typeof value.url === 'string'
  ) {
    return value.url;
  }

  return '';
};


/**
 * Serialize a single image.
 */
const serializeImage = (value, ownerId = '', index = 0, isCategory = false) => {
  if (!value) {
    return '';
  }

  /* Already a URL or Base64 string */
  if (typeof value === 'string') {
    return value;
  }

  if (value.url && typeof value.url === 'string') {
    return value.url;
  }

  /* If we have an ownerId, return the dedicated image streaming URL */
  if (ownerId) {
    if (isCategory) {
      return `/api/categories/${ownerId}/image`;
    }
    return `/api/products/${ownerId}/images/${index}`;
  }

  /* Fallback: Mongoose subdocument / Buffer to Base64 (only if no owner ID available) */
  const plain =
    value && typeof value.toObject === 'function' ? value.toObject() : value;

  return toBase64DataUrl(plain);
};


/**
 * Serialize multiple images.
 */
const serializeImages = (images = [], ownerId = '') => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image, index) => serializeImage(image, ownerId, index, false))
    .filter(Boolean);
};


/**
 * Serialize a MongoDB/Mongoose document into a lightweight representation
 * with dedicated streaming image URLs instead of huge Base64 strings.
 */
const serializeDocument = (doc) => {
  if (!doc) {
    return doc;
  }

  const plain =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : { ...doc };

  const ownerId = plain._id ? plain._id.toString() : '';

  /* Product gallery */
  if (Array.isArray(plain.images)) {
    plain.images = serializeImages(plain.images, ownerId);
  } else if (plain.images !== undefined) {
    plain.images = [];
  }

  /* Single image (e.g. Category) */
  if (plain.image !== undefined && plain.image !== null) {
    plain.image = serializeImage(plain.image, ownerId, 0, true);
  }

  return plain;
};


/**
 * Serialize an array of products.
 */
const serializeProducts = (products = []) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => serializeDocument(product));
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  toBase64DataUrl,
  serializeImage,
  serializeImages,
  serializeDocument,
  serializeProducts,
};