const Company = require('../models/companymodel');

exports.createCompany = async (req, res) => {
    try {
        let { name, contactEmail, email, address, companyId } = req.body;
        if (!name || !(contactEmail || email)) {
            return res.status(400).json({ error: 'Company name and contact email are required.' });
        }
        contactEmail = contactEmail || email;

        // First check if a company exists with the same name (required unique field)
        const existingByName = await Company.findOne({ name });
        if (existingByName) {
            return res.status(409).json({ error: `Company name already exists.` });
        }

        // Then check if a company exists with the same email (required unique field)
        const existingByEmail = await Company.findOne({ contactEmail });
        if (existingByEmail) {
            return res.status(409).json({ error: `Company contact email already exists.` });
        }

        // If address is provided, check for duplicate combination of name+email+address
        // This is an additional check beyond the unique constraints
        if (address) {
            const existingByAll = await Company.findOne({
                name,
                contactEmail,
                address
            });
            if (existingByAll) {
                return res.status(409).json({
                    error: `A company with the same name, email, and address already exists.`
                });
            }
        }
        if (!companyId) {
            const prefix = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
            const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
            companyId = `${prefix}${suffix}`;
        }
        const company = new Company({ name, contactEmail, address, companyId });
        await company.save();
        return res.status(201).json({ message: 'Company created successfully.', company });
    } catch (err) {
        console.error('Create Company Error:', err);
        return res.status(500).json({ error: 'Server error.' });
    }
};

// Get all companies with pagination
exports.getCompanies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search } = req.query;
        let query = {};
        if (search) {
            const regex = { $regex: search, $options: 'i' };
            query = {
                $or: [
                    { name: regex },
                    { address: regex },
                    { contactEmail: regex },
                    { companyId: regex }
                ]
            };
        }
        const [companies, total] = await Promise.all([
            Company.find(query)
                .skip(skip)
                .limit(limit)
                .select('name address contactEmail companyId createdAt'),
            Company.countDocuments(query)
        ]);
        const pages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            data: companies,
            pagination: {
                current: page,
                pages,
                total
            }
        });
    } catch (err) {
        console.error('Get Companies Error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get company by MongoDB _id or companyId
exports.getCompanyById = async (req, res) => {
    try {
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
};

// Update company by _id or companyId
exports.updateCompany = async (req, res) => {
    try {
        let company;
        if (req.params.id.length === 24) {
            company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        } else {
            company = await Company.findOneAndUpdate({ companyId: req.params.id }, req.body, { new: true });
        }
        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }
        res.json({ message: 'Company updated successfully.', company });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
};

// Delete company by _id or companyId
exports.deleteCompany = async (req, res) => {
    try {
        let company;
        if (req.params.id.length === 24) {
            company = await Company.findByIdAndDelete(req.params.id);
        } else {
            company = await Company.findOneAndDelete({ companyId: req.params.id });
        }
        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }
        res.json({ message: 'Company deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
};
