const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));

// Set user info to locals for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/tracking', require('./routes/tracking'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/shipments', require('./routes/shipments'));
app.use('/users', require('./routes/users'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
