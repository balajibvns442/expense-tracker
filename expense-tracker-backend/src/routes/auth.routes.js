const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const userModel = require('../models/user.model');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/delete',protect , authController.deleteUser);

router.get('/me' , protect , async (req , res) => {
    const user = await userModel.findById(req.user.id);
    res.json(user);
});

module.exports = router;

