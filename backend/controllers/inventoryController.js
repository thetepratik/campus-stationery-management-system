const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const inventoryService = require('../services/inventoryService');

const restock = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { product, ledgerEntry } = await inventoryService.restockProduct(req.body, req.user._id, io);
  success(res, 200, `${product.name} restocked successfully`, { product, ledgerEntry });
});

const adjust = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { product, ledgerEntry } = await inventoryService.adjustStock(req.body, req.user._id, io);
  success(res, 200, `Stock for ${product.name} adjusted successfully`, { product, ledgerEntry });
});

const stockLevels = asyncHandler(async (req, res) => {
  const { items, meta } = await inventoryService.getStockLevels(req.query);
  success(res, 200, 'Stock levels fetched', { products: items }, meta);
});

const stockHistory = asyncHandler(async (req, res) => {
  const { items, meta } = await inventoryService.getStockHistory(req.query);
  success(res, 200, 'Stock history fetched', { entries: items }, meta);
});

const valueReport = asyncHandler(async (req, res) => {
  const report = await inventoryService.getInventoryValueReport();
  success(res, 200, 'Inventory value report fetched', report);
});

module.exports = { restock, adjust, stockLevels, stockHistory, valueReport };
