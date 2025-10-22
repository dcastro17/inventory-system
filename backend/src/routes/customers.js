const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/customersController');

router.get('/', authMiddleware, ctrl.list);
router.get('/:id', authMiddleware, ctrl.get);
router.post('/', authMiddleware, requireRole('admin'), ctrl.create);
router.put('/:id', authMiddleware, requireRole('admin'), ctrl.update);
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.remove);

module.exports = router;
