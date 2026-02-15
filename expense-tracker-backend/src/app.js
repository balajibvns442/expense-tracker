const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const expenseRoutes = require('./routes/expense.routes');
const { errorHandler } = require("./middlewares/error.middleware") ;

const app = express();


app.use(cors());
app.use(express.json());
app.use(errorHandler) ;

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/expenses', expenseRoutes);

app.get('/testing', (req, res) => {
    res.json({ message: 'Server is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});