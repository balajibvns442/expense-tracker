const db = require('../config/db');

exports.createCategory = async (userId, name) => {
    const [result] = await db.execute(
        'INSERT INTO categories (user_id,name) VALUES (?,?)',
        [userId, name]
    );
    return result.insertId;
};


exports.getCategoriesByUser = async (userId) => {
    const [rows] = await db.execute(
        'SELECT id, name , created_at FROM categories WHERE user_id = ?',
        [userId]
    );
    console.log('Categories fetched from DB:', rows);
    return rows;
};

exports.findByIdanduser = async (categoryId, userId) => {
    const [rows] = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND user_id = ?',
        [categoryId, userId]
    );
    return rows[0];
};

exports.deleteCategory = async (id, userId) => {
    const [result] = await db.execute(
        'DELETE FROM categories WHERE id = ? AND user_id = ?',
        [id, userId]
    );
    return result.affectedRows ;
};