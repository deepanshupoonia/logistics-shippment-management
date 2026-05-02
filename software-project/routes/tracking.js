const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('tracking', { title: 'Track Shipment', shipment: null, error: null });
});

// Added GET route for viewing specific track IDs instantly from links
router.get('/:number', async (req, res) => {
    const tracking_number = req.params.number.toUpperCase();
    try {
        const result = await db.query('SELECT * FROM shipments WHERE tracking_number = $1', [tracking_number]);
        if (result.rows.length > 0) {
            const historyResult = await db.query('SELECT * FROM shipment_history WHERE shipment_id = $1 ORDER BY created_at DESC', [result.rows[0].id]);
            res.render('tracking', { title: 'Track Shipment', shipment: result.rows[0], history: historyResult.rows, error: null });
        } else {
            res.render('tracking', { title: 'Track Shipment', shipment: null, error: 'Shipment not found' });
        }
    } catch (err) {
        console.error(err);
        res.render('tracking', { title: 'Track Shipment', shipment: null, error: 'Database error' });
    }
});

router.post('/', async (req, res) => {
    const { tracking_number } = req.body;
    try {
        const result = await db.query('SELECT * FROM shipments WHERE tracking_number = $1', [tracking_number]);
        if (result.rows.length > 0) {
            const historyResult = await db.query('SELECT * FROM shipment_history WHERE shipment_id = $1 ORDER BY created_at DESC', [result.rows[0].id]);
            res.render('tracking', { title: 'Track Shipment', shipment: result.rows[0], history: historyResult.rows, error: null });
        } else {
            res.render('tracking', { title: 'Track Shipment', shipment: null, error: 'Shipment not found' });
        }
    } catch (err) {
        console.error(err);
        res.render('tracking', { title: 'Track Shipment', shipment: null, error: 'Database error' });
    }
});

module.exports = router;
