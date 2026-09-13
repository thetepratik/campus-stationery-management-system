const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Generates a unique-ish SKU: SKU-<6 random alphanumeric chars>.
 * Uniqueness is enforced at the DB layer (unique index); caller should retry
 * on a duplicate-key error, which is exceedingly rare at this keyspace size.
 */
const generateSku = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SKU-${code}`;
};

const generateBarcode = () => {
  // EAN-13-like numeric string (not checksum-validated, sufficient for internal use)
  let code = '890'; // arbitrary prefix
  for (let i = 0; i < 10; i++) code += Math.floor(Math.random() * 10);
  return code;
};

module.exports = { slugify, generateSku, generateBarcode };
