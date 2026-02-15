const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

exports.register = async (username, email, password) => {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
        throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser(username, email, passwordHash);
    return userId;
}

exports.login = async (email, password) => {
    const user = await userModel.findByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return token;
}

exports.deleteUser = async (id) => {
    const deletedRows = await userModel.deleteUser(id);
    if (deletedRows === 0) {
        throw new Error('User not found');
    }
};