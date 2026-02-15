const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router ;
