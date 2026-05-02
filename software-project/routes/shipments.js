const express = require('express');
const db = require('../config/db');
const router = express.Router();

const checkAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/auth/login');
    next();
};

// GET Form to create shipment
router.get('/new', checkAuth, (req, res) => {
    const role = req.session.user.role;
    if (role === 'driver') return res.status(403).send("Forbidden");
    res.render('create_shipment', { title: 'Register Shipment', role, user: req.session.user });
});

// POST to create a shipment
router.post('/new', checkAuth, async (req, res) => {
    let { 
        sender_name, sender_address, 
        receiver_name, receiver_address,
        package_type, weight_kg, dimensions,
        special_handling, shipment_type, instructions
    } = req.body;

    // If it's a customer, force the sender_name to their authorized account name to prevent spoofing
    if (req.session.user.role === 'customer') {
        sender_name = req.session.user.name;
    }

    const tracking_number = 'GL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    try {
        const query = `
            INSERT INTO shipments (
                tracking_number, sender_name, sender_address, receiver_name, 
                receiver_address, package_type, weight_kg, dimensions, 
                special_handling, handling_instructions, shipment_type, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'registered') RETURNING id
        `;
        const values = [
            tracking_number, sender_name, sender_address, receiver_name, 
            receiver_address, package_type, weight_kg, dimensions, 
            special_handling === 'on', instructions, shipment_type
        ];
        
        const result = await db.query(query, values);
        
        // Log history
        await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, 'registered', 'Initial registration', $2)`, [result.rows[0].id, req.session.user.id]);
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error during creation');
    }
});

// Update standard status 
router.post('/update', checkAuth, async (req, res) => {
    const { id, status } = req.body;
    try {
        await db.query(`UPDATE shipments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [status, id]);
        await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, $2, 'Status updated via dashboard', $3)`, [id, status, req.session.user.id]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating status');
    }
});

// Issue / Complaints Logging
router.post('/issue', checkAuth, async (req, res) => {
    const { id, notes } = req.body;
    try {
        // Appends to the complaints field
        await db.query(`UPDATE shipments SET complaints = CONCAT(COALESCE(complaints, ''), '\n[', CURRENT_TIMESTAMP::text, ']: ', $1::text) WHERE id = $2`, [notes, id]);
        
        await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, 'issue_logged', $2, $3)`, [id, notes, req.session.user.id]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging issue');
    }
});

// Customer Service Update (Contact info, reschedule, hold)
router.post('/cs-update', checkAuth, async (req, res) => {
    const { id, receiver_name, receiver_address, notes, action } = req.body;
    try {
        // 1. Update the address/contact info 
        await db.query(`UPDATE shipments SET receiver_name = $1, receiver_address = $2 WHERE id = $3`, [receiver_name, receiver_address, id]);
        
        // 2. Add to complaint logs if notes exist
        if (notes && notes.trim() !== '') {
            await db.query(`UPDATE shipments SET complaints = CONCAT(COALESCE(complaints, ''), '\n[', CURRENT_TIMESTAMP::text, ' CS Call]: ', $1::text) WHERE id = $2`, [notes, id]);
            await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, 'cs_contact', $2, $3)`, [id, 'Customer call logged', req.session.user.id]);
        }

        // 3. Perform overriding actions (Hold or Reschedule)
        if (action === 'hold') {
            await db.query(`UPDATE shipments SET status = 'held', route_plan = 'HELD BY CS REQUEST', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
            await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, 'held', 'Package held by CS', $2)`, [id, req.session.user.id]);
        } else if (action === 'reschedule') {
            // Clears driver and resets to pickup queue
            await db.query(`UPDATE shipments SET status = 'ready_for_pickup', route_plan = 'RESCHEDULED', driver_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
            await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, 'ready_for_pickup', 'Rescheduled by CS', $2)`, [id, req.session.user.id]);
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing CS update');
    }
});

// Assign Driver & Route (Operations)
router.post('/assign', checkAuth, async (req, res) => {
    let { id, driver_id, route_plan } = req.body;
    try {
        driver_id = driver_id || null;
        await db.query(`UPDATE shipments SET driver_id = $1, route_plan = $2, status = 'ready_for_pickup', updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [driver_id, route_plan, id]);
        
        await db.query(`INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, 'ready_for_pickup', $2, $3)`, [id, `Assigned to Driver ${driver_id} | Route: ${route_plan}`, req.session.user.id]);
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error assigning route');
    }
});

module.exports = router;