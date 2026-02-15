const expenseModel = require('../models/expense.model');
const categoryModel = require('../models/category.model');
const { mongo } = require('mongoose');

exports.addExpense = async(userId,body)=>{
    const {categoryId , title , amount , description } = body ;
    let { expenseDate } = body ;

    if( !categoryId || !amount || !title )
        throw new Error('zmissing required fields');

    if( amount <= 0 )
        throw new Error('Amount must be greater than zero');   

    const category = await categoryModel.findByIdanduser(categoryId , userId );
    if( !category )
        throw new Error('Invalid category for this user');
    
    if( !expenseDate ){
        console.log('No expense date provided, using today\'s date'); // Debugging line
        const today = new Date() ;
        expenseDate = today.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
    }

    

    console.log('Adding expense for user:', userId, 'with data:', body); // Debugging line

    return await expenseModel.createExpense({
        userId ,
        categoryId,
        title,
        amount,
        description: description ?? null,
        expenseDate
    });
};

exports.getExpenses = async (userId , query ) => {
    const { from , to , limit , offset } = query ;
    return await expenseModel.getExpensesByUser(userId , from , to , limit , offset );
};

exports.removeExpense = async(id , userId) => {
    const deleted = await expenseModel.deleteExpense(id , userId);
    if( !deleted )
        throw new Error('Expense not found for the user');
} ;

exports.updateExpense = async (expenseId, userId, data) => {
  const existing = await expenseModel.findById(expenseId);

  if (!existing) {
    throw new Error("Expense not found");
  }

  if (existing.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  if (data.categoryId) {
    const category = await categoryModel.findById(data.categoryId);
    if (!category || category.user_id !== userId) {
      throw new Error("Invalid category");
    }
  }

  if (!data.expenseDate) {
    data.expenseDate = existing.expense_date;
  }

  return await expenseModel.update(expenseId, data);
};


exports.getMonthlySummary = async (userId, month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear() ;
  const currentMonth = now.getMonth() + 1 ;

  if( month<1 || month>12 ){
    throw new Error("Invalid month") ;
  }

  if( year<2000 || year>currentYear ) {
    throw new Error("Invalid Year ") ;
  }

  if( year===currentYear && month > currentMonth ){
    throw new Error(" Future month access not allowed ") ;
  }

  const totalAmount = await expenseModel.getMonthlyTotal(userId,month,year) ;
  const breakDown = await expenseModel.getCategoryBreakDown(userId,month,year) ;

  return {
    totalAmount : totalAmount || 0 ,
    CategoryBreakDown : breakDown
  };

};

exports.getExpenseCount = async (userId,from,to) => {
  const count = await expenseModel.countExpenses(userId,from,to) ;

  return count ;
};
