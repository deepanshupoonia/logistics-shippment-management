const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const router = express.Router();

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { title: 'Login - GreenLeaf', error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user.id, name: user.name, role: user.role };
            res.redirect('/dashboard');
        } else {
            res.render('login', { title: 'Login', error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login', error: 'An error occurred' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
