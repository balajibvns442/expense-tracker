const db = require('../config/db');

exports.createUser = async (username, email , passwordHash) => {
    const [result] = await db.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, passwordHash]
    );
    return result.insertId;
}

exports.findByEmail = async (email) => {
    const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return rows[0];
}

exports.findById = async (id) => {
    const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ?', 
        [id]
    );
    return rows[0];
}

exports.deleteUser = async(id) => {
    const [result] = await db.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
    );
    return result.affectedRows;
}   