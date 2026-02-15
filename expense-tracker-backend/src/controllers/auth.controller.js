const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
    const { username, email, password } = req.body;

    console.log('Registering user:', { username, email });
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userId = await authService.register(username, email, password);
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        next(error) ;
    }
}

exports.login = async (req, res , next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const token = await authService.login(email, password);
        res.json({ token });
    } catch (error) {
        next(error) ;
    }
}

exports.deleteUser = async (req, res , next) => {
    try {
        await authService.deleteUser(req.userId);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error) ;
    }
}