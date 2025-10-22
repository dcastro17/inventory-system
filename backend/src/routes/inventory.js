const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/inventoryController');

router.get('/', authMiddleware, ctrl.list);
router.put('/:productId', authMiddleware, requireRole('admin'), ctrl.adjust);

module.exports = router;
