const express = require('express');
const router = express.Router();

const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken, requireRole('student'));

router.get('/', wishlistController.getWishlist);
router.post('/:productId', wishlistController.toggleWishlist);

module.exports = router;
