const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Middleware to check authentication
const checkAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/auth/login');
    next();
};

router.get('/', checkAuth, async (req, res) => {
    try {
        const role = req.session.user.role;
        let data = {};
        
        if (role === 'driver') {
            const result = await db.query('SELECT * FROM shipments WHERE driver_id = $1', [req.session.user.id]);
            data.shipments = result.rows;
        } else if (role === 'customer') {
            const result = await db.query('SELECT * FROM shipments WHERE sender_name = $1 ORDER BY created_at DESC', [req.session.user.name]);
            data.shipments = result.rows;
        } else {
            const result = await db.query('SELECT * FROM shipments ORDER BY created_at DESC LIMIT 50');
            data.shipments = result.rows;
        }

        res.render('dashboard', { title: 'Dashboard', user: req.session.user, role, data });
    } catch (err) {
        console.error(err);
        res.send('Error loading dashboard');
    }
});

module.exports = router;
