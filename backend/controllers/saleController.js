const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const saleService = require('../services/saleService');
const { streamSaleInvoice } = require('../services/invoicePdfService');

const createSale = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const sale = await saleService.createSale(req.body, req.user._id, io);
  success(res, 201, `Sale ${sale.saleId} recorded successfully`, { sale });
});

const listSales = asyncHandler(async (req, res) => {
  const { items, meta } = await saleService.listSales(req.query);
  success(res, 200, 'Sales fetched', { sales: items }, meta);
});

const getSale = asyncHandler(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  success(res, 200, 'Sale fetched', { sale });
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  streamSaleInvoice(sale, res);
});

module.exports = { createSale, listSales, getSale, downloadInvoice };
