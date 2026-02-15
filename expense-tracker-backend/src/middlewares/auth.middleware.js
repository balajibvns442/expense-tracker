const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized , No token provided' });
        }

        const token = header.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.id,

        req.user = {
            id: decoded.id,
            email: decoded.email
        }
        console.log('Authenticated user ID:', req.userId); // Debugging line
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized , Invalid token' });

    }
}; 