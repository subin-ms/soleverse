const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public', couponController.getPublicCoupons);
router.post('/validate', protect, couponController.validateCoupon);

router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id/status', couponController.toggleStatus);
router.patch('/:id/visibility', couponController.toggleVisibility);

module.exports = router;
