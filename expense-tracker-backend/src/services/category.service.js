const categoryModel = require('../models/category.model');

exports.addCategory = async (userId, name) => {
    if(!name) throw new Error('Category nae required') ;
    return await categoryModel.createCategory(userId, name);
};

exports.getAllCategories = async(userId) => {
    console.log('Getting categories for user in the service layer :', userId);
    return await categoryModel.getCategoriesByUser(userId);
};

exports.removeCategory = async(id , userId) => {
    const deleted = await categoryModel.deleteCategory(id , userId) ;
    if(!deleted) throw new Error('Category not found or unauthorized') ;
};