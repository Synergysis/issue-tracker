const express = require('express');
const router = express.Router();
const {
	createCompany,
	getCompanies,
	getCompanyById,
	updateCompany,
	deleteCompany
} = require('../controllers/companycontroller');

// Create a new company
router.post('/company', createCompany);

// Get all companies with pagination
router.get('/companies', getCompanies);

// Get company by MongoDB _id or companyId
router.get('/company/:id', getCompanyById);

// Update company by _id or companyId
router.put('/company/:id', updateCompany);

// Delete company by _id or companyId
router.delete('/company/:id', deleteCompany);

module.exports = router;
