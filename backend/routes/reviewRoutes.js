const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { reviewCreateValidation, reviewUpdateValidation } = require('../validations/reviewValidation');

router.get('/product/:productId', reviewController.listForProduct);

router.post('/', verifyToken, requireRole('student'), reviewCreateValidation, validate, reviewController.createReview);
router.put('/:id', verifyToken, requireRole('student'), reviewUpdateValidation, validate, reviewController.updateReview);
router.delete('/:id', verifyToken, requireRole('student'), reviewController.deleteReview);

module.exports = router;
