const categoryService = require('../services/category.service');

exports.createCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        const categoryId = await categoryService.addCategory(req.user.id, name);
        res.status(201).json({ message:"Categoy created " , id: categoryId, name });
    } catch (error) {
        next(error) ;
    }
};

exports.getCategories = async (req, res,next) => {
    console.log('Controller: Getting categories for user:', req.user.id);
    
    try {
        console.log('Fetching categories for user:', req.user.id);
        const categories = await categoryService.getAllCategories(req.user.id); 
        res.json(categories);
    } catch (error) {
        next(error) ;
    }
};

exports.deleteCategory = async(req,res , next) => {
    try{
        await categoryService.removeCategory(req.params.id , req.user.id) ;
        res.json({ message: 'Category deleted successfully' }); 
    }catch(error){
        next(error) ;
    }
};

