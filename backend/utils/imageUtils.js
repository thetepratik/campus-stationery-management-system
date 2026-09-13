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
const serializeImage = (value) => {
  if (!value) {
    return '';
  }

  /* Already serialized */
  if (typeof value === 'string') {
    return value;
  }

  /* Mongoose subdocument */
  const plain =
    value &&
    typeof value.toObject === 'function'
      ? value.toObject()
      : value;

  return toBase64DataUrl(plain);
};


/**
 * Serialize multiple images.
 *
 * IMPORTANT:
 * This function was missing in your previous
 * imageUtils.js and caused:
 *
 * TypeError: serializeImages is not a function
 */
const serializeImages = (images = []) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => serializeImage(image))
    .filter(Boolean);
};


/**
 * Serialize a MongoDB/Mongoose document.
 */
const serializeDocument = (doc) => {
  if (!doc) {
    return doc;
  }

  const plain =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : { ...doc };

  /* Product gallery */
  if (Array.isArray(plain.images)) {
    plain.images = serializeImages(
      plain.images
    );
  } else {
    plain.images = [];
  }

  /* Single image */
  if (
    plain.image !== undefined &&
    plain.image !== null
  ) {
    plain.image = serializeImage(
      plain.image
    );
  }

  return plain;
};


/**
 * Serialize an array of products.
 */
const serializeProducts = (
  products = []
) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(
    (product) =>
      serializeDocument(product)
  );
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