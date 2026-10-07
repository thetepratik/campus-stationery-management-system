const express = require('express');
const router = express.Router();

const storeController = require('../controllers/storeController');
const productController = require('../controllers/productController');

router.get('/home', storeController.getHome);
router.get('/products', storeController.listProducts);
router.get('/products/:id/images/:imageIndex', productController.getProductImage);
router.get('/products/:id', storeController.getProduct);
router.get('/brands', storeController.getBrands);

module.exports = router;
