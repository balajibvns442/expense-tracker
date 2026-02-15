const { decrypt } = require("dotenv");
const Joi = require("joi") ;

exports.createExpenseSchema = Joi.object({
    categoryId: Joi.number().integer().required() ,
    title: Joi.string().trim().min(1).required(),
    description: Joi.string().allow('',null),
    amount: Joi.number().positive().required(),
    expenseDate: Joi.date().optional()
});

exports.updateExpenseSchema = Joi.object({
    categoryId: Joi.number().integer().optional(),
    title: Joi.string().trim().min(1).required(),
    description: Joi.string().allow('',null),
    expenseDate: Joi.date().optional()
}).min(1);

