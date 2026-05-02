const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Middleware to check if user is Ops Manager
const isOpsManager = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'operations') {
        next();
    } else {
        res.status(403).send('Access denied. Ops Manager role required.');
    }
};

router.use(isOpsManager);

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC');
        res.render('users', { title: 'User Management', users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/add', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, role]
        );
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        res.status(400).send('Error adding user. Email might exist.');
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;