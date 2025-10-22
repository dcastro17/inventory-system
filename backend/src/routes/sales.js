const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/salesController');

router.post('/', authMiddleware, ctrl.createSale);
router.get('/', authMiddleware, requireRole('admin'), ctrl.list);
router.get('/:id', authMiddleware, requireRole('admin'), ctrl.get);

module.exports = router;
