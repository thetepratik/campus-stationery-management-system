/**
 * Parses page/limit query params and returns { skip, limit, page } plus a
 * buildMeta(totalCount) helper to shape the response's pagination metadata.
 */
const getPagination = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  const buildMeta = (totalCount) => ({
    page,
    limit,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    hasNextPage: page * limit < totalCount,
    hasPrevPage: page > 1,
  });

  return { page, limit, skip, buildMeta };
};

module.exports = { getPagination };
