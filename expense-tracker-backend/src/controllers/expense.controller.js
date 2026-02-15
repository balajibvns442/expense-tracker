const expenseService = require('../services/expense.service');  

exports.createExpense = async (req, res, next) => {
    try{
        console.log('Request Body:', req.body); // Debugging line
        const expenseId = await expenseService.addExpense(req.userId, req.body);
        res.status(201).json({ message: 'Expense created', expenseId });
    } catch (error) {
        next(error) ;
    }
};

exports.getExpenses = async(req , res, next) => {
    try{
        const expenses = await expenseService.getExpenses(req.userId , req.query );
        res.status(200).json({ expenses });
    } catch (error) {
        next(error) ;
    }
};

exports.deleteExpense = async (req, res, next) => {
    try{
        await expenseService.removeExpense(req.params.id , req.userId); 
        res.status(200).json({ message: 'Expense deleted' });
    } catch (error) {
        next(error) ;
    }
};

exports.updateExpense = async (req,res, next) => {
    try{
        const expenseId = req.params.id ;
        const userId = req.user.id ;

        const updated = await expenseService.updateExpense(
            expenseId,
            userId,
            req.body,
        );

        res.json( {message : "Expense updated Successfully ", updated });
    }
    catch (error){
        next(error) ;
    }
};

exports.getMonthlySummary = async (req,res, next) => {

    try{
        const userId = req.user.id ;
        const {month,year } = req.query ;

        if( !month|| !year ){
            res.status(400).json({error : "Month and Year are expected "}) ;
        }

        const summary = await expenseService.getMonthlySummary(
            userId,
            Number(month) ,
            Number(year)
        );

        res.json(summary) ;
    } catch (error) {
        next(error) ;
    }
};

exports.getExpenseCount = async (req,res,next) => {

    try{

        const userId = req.user.id ;
        const {from,to} = req.query ;

        const count = await expenseService.getExpenseCount(userId,from,to) ;
         
        res.json({total : count}) ;
    
    } catch( error ){
        next(error) ;
    }
};



