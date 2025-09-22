const express = require('express');
const Company = require('../models/companymodel');
const router = express.Router();

// GET /api/company/:id - Get company by MongoDB _id
router.get('/company/:id', async (req, res) => {
    try {
        // If id is 24 chars, treat as MongoDB _id, else treat as companyId
        let company;
        if (req.params.id.length === 24) {
            company = await Company.findById(req.params.id);
        } else {
            company = await Company.findOne({ companyId: req.params.id });
        }
        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }
        res.json({ data: company });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
