const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createExpenseSchema, updateExpenseSchema } = require('../validators/expense.validator');

router.use(protect);

router.post('/', validate(createExpenseSchema), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.delete('/:id', expenseController.deleteExpense);
router.put('/:id', validate(updateExpenseSchema), expenseController.updateExpense);
router.get("/summary", expenseController.getMonthlySummary);
router.get("/count", expenseController.getExpenseCount);

module.exports = router;
