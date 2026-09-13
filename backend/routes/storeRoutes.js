const express = require('express');
const router = express.Router();

const storeController = require('../controllers/storeController');

router.get('/home', storeController.getHome);
router.get('/products', storeController.listProducts);
router.get('/products/:id', storeController.getProduct);

module.exports = router;
