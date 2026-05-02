const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    } else {
        return res.redirect('/auth/login');
    }
});

module.exports = router;
