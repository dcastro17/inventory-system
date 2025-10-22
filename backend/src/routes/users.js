const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/usersController');

router.use(authMiddleware);
router.get('/', requireRole('admin'), ctrl.list);
router.get('/:id', requireRole('admin'), ctrl.get);
router.post('/', requireRole('admin'), ctrl.create);
router.put('/:id', requireRole('admin'), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
